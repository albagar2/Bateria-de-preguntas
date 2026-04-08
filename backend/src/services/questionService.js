// ============================================
// Question Service - Application Layer
// Handles question CRUD, answering, and
// spaced repetition logic
// ============================================
const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');
const { calculateSpacedRepetition, getQualityFromAnswer } = require('../utils/spacedRepetition');

class QuestionService {
  /**
   * Get questions with optional filters
   */
  async getAll({ topicId, difficulty, page = 1, limit = 20 }) {
    const where = { isActive: true };
    if (topicId) where.topicId = topicId;
    if (difficulty) where.difficulty = difficulty;

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          topic: { select: { id: true, title: true } },
        },
      }),
      prisma.question.count({ where }),
    ]);

    return {
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single question (for admin — includes answer)
   */
  async getById(id) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { topic: { select: { id: true, title: true } } },
    });

    if (!question) throw new AppError('Pregunta no encontrada', 404);
    return question;
  }

  /**
   * Get questions for "modo sin fallos" (no-fail mode)
   * Returns questions sequentially from a topic
   */
  async getNoFailModeQuestions(topicId, userId, difficulty = null) {
    const where = { topicId, isActive: true };
    if (difficulty) where.difficulty = difficulty;

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        questionText: true,
        options: true,
        difficulty: true,
      },
    });

    if (questions.length === 0) {
      throw new AppError('No hay preguntas disponibles para este tema', 404);
    }

    return questions;
  }

  /**
   * Get questions for spaced repetition review
   */
  async getReviewQuestions(userId, limit = 20) {
    const now = new Date();

    // Get questions due for review
    const dueProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        nextReview: { lte: now },
        isMastered: false,
      },
      include: {
        question: {
          select: {
            id: true,
            questionText: true,
            options: true,
            difficulty: true,
            topicId: true,
          },
        },
      },
      orderBy: { nextReview: 'asc' },
      take: limit,
    });

    return dueProgress.map((p) => p.question);
  }

  /**
   * Answer a question — updates progress and mistakes
   */
  async answerQuestion(userId, { questionId, selectedIndex, responseTime }) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) throw new AppError('Pregunta no encontrada', 404);

    const isCorrect = selectedIndex === question.correctIndex;
    const quality = getQualityFromAnswer(isCorrect, responseTime);

    // Get existing progress for spaced repetition
    const existingProgress = await prisma.userProgress.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });

    const sr = calculateSpacedRepetition(
      quality,
      existingProgress?.easeFactor || 2.5,
      existingProgress?.interval || 1
    );

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Upsert progress
      const progress = await tx.userProgress.upsert({
        where: { userId_questionId: { userId, questionId } },
        create: {
          userId,
          questionId,
          isCorrect,
          attempts: 1,
          responseTime,
          nextReview: sr.nextReview,
          easeFactor: sr.nextEaseFactor,
          interval: sr.nextInterval,
          isMastered: isCorrect && sr.nextInterval >= 21, // 3+ weeks interval = mastered
        },
        update: {
          isCorrect,
          attempts: { increment: 1 },
          lastAttempt: new Date(),
          responseTime,
          nextReview: sr.nextReview,
          easeFactor: sr.nextEaseFactor,
          interval: sr.nextInterval,
          isMastered: isCorrect && sr.nextInterval >= 21,
        },
      });

      // Handle mistakes
      if (!isCorrect) {
        await tx.mistake.upsert({
          where: { userId_questionId: { userId, questionId } },
          create: {
            userId,
            questionId,
            mistakeCount: 1,
            isResolved: false,
          },
          update: {
            mistakeCount: { increment: 1 },
            lastMistake: new Date(),
            isResolved: false,
          },
        });
      } else if (isCorrect && existingProgress) {
        // Mark mistake as resolved if exists
        await tx.mistake.updateMany({
          where: { userId, questionId, isResolved: false },
          data: { isResolved: true },
        });
      }

      // Update streak
      await this._updateStreak(tx, userId, isCorrect);

      return progress;
    });

    return {
      isCorrect,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      progress: result,
    };
  }

  /**
   * Create a question (admin only)
   */
  async create(data) {
    // Verify topic exists
    const topic = await prisma.topic.findUnique({ where: { id: data.topicId } });
    if (!topic) throw new AppError('Tema no encontrado', 404);

    return prisma.question.create({ data });
  }

  /**
   * Update a question (admin only)
   */
  async update(id, data) {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) throw new AppError('Pregunta no encontrada', 404);

    return prisma.question.update({ where: { id }, data });
  }

  /**
   * Soft delete a question (admin only)
   */
  async delete(id) {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) throw new AppError('Pregunta no encontrada', 404);

    return prisma.question.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── Private Methods ────────────────────────

  async _updateStreak(tx, userId, isCorrect) {
    const streak = await tx.streak.findUnique({ where: { userId } });
    if (!streak) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastStudy = streak.lastStudyDate ? new Date(streak.lastStudyDate) : null;
    if (lastStudy) lastStudy.setHours(0, 0, 0, 0);

    let updates = { lastStudyDate: new Date() };

    // Daily streak
    if (!lastStudy || lastStudy.getTime() !== today.getTime()) {
      if (lastStudy) {
        const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          updates.currentStreak = streak.currentStreak + 1;
        } else if (daysDiff > 1) {
          updates.currentStreak = 1;
        }
      } else {
        updates.currentStreak = 1;
      }

      if ((updates.currentStreak || streak.currentStreak) > streak.maxStreak) {
        updates.maxStreak = updates.currentStreak || streak.currentStreak;
      }
    }

    // No-fail streak
    if (isCorrect) {
      updates.currentNoFail = streak.currentNoFail + 1;
      if (updates.currentNoFail > streak.maxNoFail) {
        updates.maxNoFail = updates.currentNoFail;
      }
    } else {
      updates.currentNoFail = 0;
    }

    await tx.streak.update({ where: { userId }, data: updates });
  }
}

module.exports = new QuestionService();
