// ============================================
// Stats Service - Application Layer
// User statistics, progress, achievements
// ============================================
const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

class StatsService {
  /**
   * Get comprehensive user statistics
   */
  async getUserStats(userId) {
    const [
      totalProgress,
      totalMistakes,
      streak,
      testStats,
      topicStats,
      recentActivity,
    ] = await Promise.all([
      // Overall progress
      prisma.userProgress.aggregate({
        where: { userId },
        _count: { id: true },
        _avg: { responseTime: true },
      }),
      // Total mistakes
      prisma.mistake.count({
        where: { userId, isResolved: false },
      }),
      // Streak info
      prisma.streak.findUnique({ where: { userId } }),
      // Test statistics
      prisma.test.aggregate({
        where: { userId, isCompleted: true },
        _count: { id: true },
        _avg: { score: true, timeSpent: true },
      }),
      // Per-topic stats
      this._getTopicStats(userId),
      // Recent activity (last 7 days)
      this._getRecentActivity(userId),
    ]);

    // Count correct answers
    const correctCount = await prisma.userProgress.count({
      where: { userId, isCorrect: true },
    });

    const totalAnswered = totalProgress._count.id;
    const accuracyPercent = totalAnswered > 0
      ? Math.round((correctCount / totalAnswered) * 100)
      : 0;

    // Total questions available
    const totalQuestions = await prisma.question.count({
      where: { isActive: true },
    });

    const masteredCount = await prisma.userProgress.count({
      where: { userId, isMastered: true },
    });

    return {
      overview: {
        totalAnswered,
        correctAnswers: correctCount,
        accuracyPercent,
        totalQuestions,
        masteredCount,
        progressPercent: totalQuestions > 0
          ? Math.round((masteredCount / totalQuestions) * 100)
          : 0,
        avgResponseTime: Math.round(totalProgress._avg.responseTime || 0),
        pendingErrors: totalMistakes,
      },
      streak: streak ? {
        currentStreak: streak.currentStreak,
        maxStreak: streak.maxStreak,
        currentNoFail: streak.currentNoFail,
        maxNoFail: streak.maxNoFail,
        lastStudyDate: streak.lastStudyDate,
      } : null,
      tests: {
        totalCompleted: testStats._count.id,
        averageScore: Math.round((testStats._avg.score || 0) * 100) / 100,
        averageTime: Math.round(testStats._avg.timeSpent || 0),
      },
      topicStats,
      recentActivity,
    };
  }

  /**
   * Get user's mistake bank
   */
  async getMistakes(userId, { topicId, page = 1, limit = 20 }) {
    const where = { userId, isResolved: false };

    if (topicId) {
      where.question = { topicId };
    }

    const [mistakes, total] = await Promise.all([
      prisma.mistake.findMany({
        where,
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
        orderBy: { mistakeCount: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mistake.count({ where }),
    ]);

    return {
      mistakes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get most failed questions
   */
  async getMostFailed(userId, limit = 10) {
    return prisma.mistake.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            id: true,
            questionText: true,
            difficulty: true,
            topic: { select: { title: true } },
          },
        },
      },
      orderBy: { mistakeCount: 'desc' },
      take: limit,
    });
  }

  /**
   * Get user's bookmarks
   */
  async getBookmarks(userId, { page = 1, limit = 20 }) {
    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
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
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bookmark.count({ where: { userId } }),
    ]);

    return {
      bookmarks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Toggle bookmark on a question
   */
  async toggleBookmark(userId, questionId, note = null) {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id },
      });
      return { bookmarked: false };
    }

    await prisma.bookmark.create({
      data: { userId, questionId, note },
    });
    return { bookmarked: true };
  }

  /**
   * Get user achievements
   */
  async getAchievements(userId) {
    const [allAchievements, userAchievements] = await Promise.all([
      prisma.achievement.findMany({
        where: { isActive: true },
        orderBy: { type: 'asc' },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true, unlockedAt: true },
      }),
    ]);

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    return allAchievements.map((achievement) => ({
      ...achievement,
      isUnlocked: unlockedIds.has(achievement.id),
      unlockedAt: userAchievements.find((ua) => ua.achievementId === achievement.id)?.unlockedAt || null,
    }));
  }

  /**
   * Check and award achievements
   */
  async checkAchievements(userId) {
    const [streak, stats, testCount] = await Promise.all([
      prisma.streak.findUnique({ where: { userId } }),
      prisma.userProgress.aggregate({
        where: { userId },
        _count: { id: true },
      }),
      prisma.test.count({ where: { userId, isCompleted: true } }),
    ]);

    const correctCount = await prisma.userProgress.count({
      where: { userId, isCorrect: true },
    });

    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
    });

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    const newlyUnlocked = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let qualifying = false;

      switch (achievement.type) {
        case 'STREAK':
          qualifying = (streak?.currentStreak || 0) >= achievement.threshold;
          break;
        case 'ACCURACY':
          qualifying = (streak?.currentNoFail || 0) >= achievement.threshold;
          break;
        case 'VOLUME':
          qualifying = stats._count.id >= achievement.threshold;
          break;
        case 'MASTERY':
          qualifying = correctCount >= achievement.threshold;
          break;
        case 'SPEED':
          qualifying = testCount >= achievement.threshold;
          break;
      }

      if (qualifying) {
        await prisma.userAchievement.create({
          data: { userId, achievementId: achievement.id },
        });
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  // ─── Private Methods ────────────────────────

  async _getTopicStats(userId) {
    const topics = await prisma.topic.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        _count: { select: { questions: { where: { isActive: true } } } },
      },
    });

    const progressByTopic = await prisma.userProgress.findMany({
      where: { userId },
      include: { question: { select: { topicId: true } } },
    });

    return topics.map((topic) => {
      const topicProgress = progressByTopic.filter(
        (p) => p.question.topicId === topic.id
      );
      const correct = topicProgress.filter((p) => p.isCorrect).length;
      const total = topic._count.questions;

      return {
        topicId: topic.id,
        title: topic.title,
        totalQuestions: total,
        answered: topicProgress.length,
        correct,
        accuracyPercent: topicProgress.length > 0
          ? Math.round((correct / topicProgress.length) * 100)
          : 0,
        progressPercent: total > 0
          ? Math.round((correct / total) * 100)
          : 0,
      };
    });
  }

  async _getRecentActivity(userId) {
    const days = 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const progress = await prisma.userProgress.findMany({
      where: {
        userId,
        lastAttempt: { gte: startDate },
      },
      select: {
        lastAttempt: true,
        isCorrect: true,
      },
    });

    // Group by date
    const dailyMap = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyMap[key] = { date: key, total: 0, correct: 0 };
    }

    for (const p of progress) {
      const key = p.lastAttempt.toISOString().split('T')[0];
      if (dailyMap[key]) {
        dailyMap[key].total++;
        if (p.isCorrect) dailyMap[key].correct++;
      }
    }

    return Object.values(dailyMap).reverse();
  }
}

module.exports = new StatsService();
