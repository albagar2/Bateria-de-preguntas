// ============================================
// Study Plan Service - Application Layer
// Auto-generates study plans based on exam date
// ============================================
const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

class StudyPlanService {
  /**
   * Auto-generate a study plan from today to exam date
   */
  async generate(userId, { examDate, topicIds }) {
    const exam = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exam.setHours(0, 0, 0, 0);

    if (exam <= today) {
      throw new AppError('La fecha de examen debe ser futura', 400);
    }

    const daysUntilExam = Math.floor((exam - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExam < 1) {
      throw new AppError('Necesitas al menos 1 día para el plan de estudio', 400);
    }

    // Get topic progress
    const topics = await prisma.topic.findMany({
      where: { id: { in: topicIds }, isActive: true },
      include: {
        _count: { select: { questions: { where: { isActive: true } } } },
      },
      orderBy: { order: 'asc' },
    });

    if (topics.length === 0) {
      throw new AppError('No se encontraron los temas seleccionados', 404);
    }

    // Get user's weakest topics first
    const progress = await prisma.userProgress.findMany({
      where: { userId, question: { topicId: { in: topicIds } } },
      include: { question: { select: { topicId: true } } },
    });

    // Calculate priority per topic (lower progress = higher priority)
    const topicPriority = topics.map((topic) => {
      const topicProgress = progress.filter(
        (p) => p.question.topicId === topic.id
      );
      const correct = topicProgress.filter((p) => p.isCorrect).length;
      const total = topic._count.questions;
      const progressPercent = total > 0 ? correct / total : 0;

      return {
        topicId: topic.id,
        title: topic.title,
        progressPercent,
        priority: 1 - progressPercent, // Lower progress = higher priority
      };
    }).sort((a, b) => b.priority - a.priority);

    // Delete existing future plans
    await prisma.studyPlan.deleteMany({
      where: {
        userId,
        date: { gte: today },
        isCompleted: false,
      },
    });

    // Distribute topics across days
    // Strategy: cycle through topics, weighted by priority
    const plans = [];
    const topicsPerDay = Math.max(1, Math.ceil(topicPriority.length / Math.min(daysUntilExam, 7)));

    for (let day = 0; day < daysUntilExam; day++) {
      const planDate = new Date(today);
      planDate.setDate(planDate.getDate() + day);

      // Select topics for this day (rotating with priority)
      const dayTopics = [];
      for (let t = 0; t < topicsPerDay; t++) {
        const topicIndex = (day * topicsPerDay + t) % topicPriority.length;
        dayTopics.push(topicPriority[topicIndex].topicId);
      }

      // Last few days before exam = review all
      if (daysUntilExam - day <= 3) {
        const allTopicIds = topicPriority.map((t) => t.topicId);
        plans.push({
          userId,
          date: planDate,
          topicIds: allTopicIds,
          description: `📝 Repaso general intensivo — ${daysUntilExam - day} día(s) para el examen`,
        });
      } else {
        const descriptions = dayTopics.map((id) =>
          topicPriority.find((t) => t.topicId === id)?.title
        );
        plans.push({
          userId,
          date: planDate,
          topicIds: dayTopics,
          description: `📚 Estudiar: ${descriptions.join(', ')}`,
        });
      }
    }

    // Create plans in bulk
    await prisma.studyPlan.createMany({ data: plans });

    // Update user exam date
    await prisma.user.update({
      where: { id: userId },
      data: { examDate: exam },
    });

    return {
      totalDays: daysUntilExam,
      plansCreated: plans.length,
      plans: plans.slice(0, 14), // Return first 2 weeks
    };
  }

  /**
   * Get study plans for a date range
   */
  async getPlans(userId, { startDate, endDate } = {}) {
    const where = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return prisma.studyPlan.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get today's plan
   */
  async getTodayPlan(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const plan = await prisma.studyPlan.findFirst({
      where: {
        userId,
        date: { gte: today, lt: tomorrow },
      },
    });

    if (!plan) return null;

    // Get topic details
    const topics = await prisma.topic.findMany({
      where: { id: { in: plan.topicIds } },
      select: { id: true, title: true, icon: true, color: true },
    });

    return { ...plan, topics };
  }

  /**
   * Mark plan as completed
   */
  async completePlan(userId, planId) {
    const plan = await prisma.studyPlan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) throw new AppError('Plan no encontrado', 404);

    return prisma.studyPlan.update({
      where: { id: planId },
      data: { isCompleted: true },
    });
  }
}

module.exports = new StudyPlanService();
