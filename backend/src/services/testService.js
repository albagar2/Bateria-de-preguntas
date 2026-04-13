// ============================================
// Test Service - Application Layer
// Handles test creation, submission, and scoring
// ============================================
const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

class TestService {
  /**
   * Create a new test with randomly selected questions
   */
  async create(userId, { type, topicIds, subtopicId, totalQuestions, timeLimit, penalizeErrors, difficulty }) {
    // Build question filter
    const where = { isActive: true };

    if (topicIds && topicIds.length > 0) {
      where.topicId = { in: topicIds };
    }

    if (subtopicId) {
      where.subtopicId = subtopicId;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    // For error review mode, only get failed questions
    if (type === 'ERROR_REVIEW') {
      const mistakes = await prisma.mistake.findMany({
        where: { userId, isResolved: false },
        select: { questionId: true },
      });

      if (mistakes.length === 0) {
        throw new AppError('No tienes errores pendientes de repasar', 404);
      }

      where.id = { in: mistakes.map((m) => m.questionId) };
    }

    // Get available questions
    const availableQuestions = await prisma.question.findMany({
      where,
      select: { id: true },
    });

    if (availableQuestions.length === 0) {
      throw new AppError('No hay preguntas disponibles con estos filtros', 404);
    }

    // Randomly select questions
    const selectedCount = Math.min(totalQuestions, availableQuestions.length);
    const shuffled = availableQuestions.sort(() => Math.random() - 0.5);
    const selectedIds = shuffled.slice(0, selectedCount).map((q) => q.id);

    // Create test with answers
    const test = await prisma.$transaction(async (tx) => {
      const newTest = await tx.test.create({
        data: {
          userId,
          type,
          totalQuestions: selectedCount,
          timeLimit,
          penalizeErrors: penalizeErrors || false,
        },
      });

      // Create empty answer slots
      await tx.testAnswer.createMany({
        data: selectedIds.map((questionId) => ({
          testId: newTest.id,
          userId,
          questionId,
        })),
      });

      return newTest;
    });

    // Return test with questions (without answers)
    const testWithQuestions = await prisma.test.findUnique({
      where: { id: test.id },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                options: true,
                difficulty: true,
                topic: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });

    return testWithQuestions;
  }

  /**
   * Submit an answer for a test question
   */
  async submitAnswer(userId, testId, { questionId, selectedIndex, responseTime }) {
    // Verify test belongs to user and is not completed
    const test = await prisma.test.findFirst({
      where: { id: testId, userId, isCompleted: false },
    });

    if (!test) {
      throw new AppError('Test no encontrado o ya completado', 404);
    }

    // Check time limit
    if (test.timeLimit) {
      const elapsed = Math.floor((new Date() - test.createdAt) / 1000);
      if (elapsed > test.timeLimit) {
        throw new AppError('Se ha acabado el tiempo del test', 400);
      }
    }

    // Get question to check answer
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) throw new AppError('Pregunta no encontrada', 404);

    const isCorrect = selectedIndex === question.correctIndex;

    // Update test answer
    const answer = await prisma.testAnswer.update({
      where: { testId_questionId: { testId, questionId } },
      data: {
        selectedIndex,
        isCorrect,
        responseTime,
        answeredAt: new Date(),
      },
    });

    return {
      isCorrect,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
    };
  }

  /**
   * Complete a test and calculate final score
   */
  async complete(userId, testId) {
    const test = await prisma.test.findFirst({
      where: { id: testId, userId },
      include: { answers: true },
    });

    if (!test) throw new AppError('Test no encontrado', 404);
    if (test.isCompleted) throw new AppError('El test ya está completado', 400);

    const answered = test.answers.filter((a) => a.answeredAt !== null);
    const correct = answered.filter((a) => a.isCorrect);
    const incorrect = answered.filter((a) => !a.isCorrect);

    let score;
    if (test.penalizeErrors) {
      // Penalize: correct = +1, incorrect = -0.33
      score = Math.max(0, correct.length - (incorrect.length * 0.33));
    } else {
      score = correct.length;
    }

    const timeSpent = Math.floor((new Date() - test.createdAt) / 1000);

    const updatedTest = await prisma.test.update({
      where: { id: testId },
      data: {
        score,
        correctAnswers: correct.length,
        timeSpent,
        isCompleted: true,
        completedAt: new Date(),
      },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                options: true,
                correctIndex: true,
                explanation: true,
                topic: { select: { title: true } },
              },
            },
          },
        },
      },
    });

    return updatedTest;
  }

  /**
   * Get user's test history
   */
  async getHistory(userId, { page = 1, limit = 10 }) {
    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where: { userId, isCompleted: true },
        orderBy: { completedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          score: true,
          totalQuestions: true,
          correctAnswers: true,
          timeSpent: true,
          penalizeErrors: true,
          completedAt: true,
        },
      }),
      prisma.test.count({ where: { userId, isCompleted: true } }),
    ]);

    return {
      tests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a specific test result
   */
  async getResult(userId, testId) {
    const test = await prisma.test.findFirst({
      where: { id: testId, userId },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                options: true,
                correctIndex: true,
                explanation: true,
                difficulty: true,
                topic: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });

    if (!test) throw new AppError('Test no encontrado', 404);
    return test;
  }
}

module.exports = new TestService();
