// ============================================
// Topic Service - Application Layer
// ============================================
const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

class TopicService {
  /**
   * Get all topics with question count and user progress
   */
  async getAll(userId = null) {
    const topics = await prisma.topic.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { questions: { where: { isActive: true } } },
        },
      },
    });

    if (userId) {
      // Attach user progress per topic
      const progress = await prisma.userProgress.findMany({
        where: { userId },
        include: { question: { select: { topicId: true } } },
      });

      return topics.map((topic) => {
        const topicProgress = progress.filter(
          (p) => p.question.topicId === topic.id
        );
        const totalQuestions = topic._count.questions;
        const answeredCorrectly = topicProgress.filter((p) => p.isCorrect).length;
        const mastered = topicProgress.filter((p) => p.isMastered).length;

        return {
          ...topic,
          totalQuestions,
          answeredCorrectly,
          mastered,
          progressPercent: totalQuestions > 0
            ? Math.round((answeredCorrectly / totalQuestions) * 100)
            : 0,
        };
      });
    }

    return topics.map((topic) => ({
      ...topic,
      totalQuestions: topic._count.questions,
    }));
  }

  /**
   * Get topic by ID with questions
   */
  async getById(id, userId = null) {
    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            questionText: true,
            options: true,
            difficulty: true,
            // Don't include correctIndex to prevent cheating
          },
        },
        _count: {
          select: { questions: { where: { isActive: true } } },
        },
      },
    });

    if (!topic) {
      throw new AppError('Tema no encontrado', 404);
    }

    return topic;
  }

  /**
   * Create a new topic (admin only)
   */
  async create(data) {
    return prisma.topic.create({ data });
  }

  /**
   * Update a topic (admin only)
   */
  async update(id, data) {
    const topic = await prisma.topic.findUnique({ where: { id } });
    if (!topic) throw new AppError('Tema no encontrado', 404);

    return prisma.topic.update({ where: { id }, data });
  }

  /**
   * Soft delete a topic (admin only)
   */
  async delete(id) {
    const topic = await prisma.topic.findUnique({ where: { id } });
    if (!topic) throw new AppError('Tema no encontrado', 404);

    return prisma.topic.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

module.exports = new TopicService();
