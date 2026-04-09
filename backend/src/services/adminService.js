const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

class AdminService {
  /**
   * Get all users with their basic info
   */
  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        opposition: {
            select: { name: true }
        },
        _count: {
            select: { tests: true, mistakes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Delete a user by ID (Admin action)
   */
  async deleteUser(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('Usuario no encontrado', 404);
    
    if (user.role === 'ADMIN') {
        throw new AppError('No se puede eliminar a otro administrador', 403);
    }

    await prisma.user.delete({ where: { id: userId } });
    return { message: 'Usuario eliminado correctamente' };
  }

  /**
   * Update user role
   */
  async updateUserRole(userId, role) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, role: true }
    });
  }

  /**
   * Get global system stats
   */
  async getSystemStats() {
    const [userCount, questionCount, testCount, topicCount] = await Promise.all([
      prisma.user.count(),
      prisma.question.count(),
      prisma.test.count(),
      prisma.topic.count()
    ]);

    return {
      users: userCount,
      questions: questionCount,
      tests: testCount,
      topics: topicCount
    };
  }

  // --- Topic Management ---
  async createTopic(data) {
    return prisma.topic.create({ data });
  }

  async updateTopic(id, data) {
    return prisma.topic.update({ where: { id }, data });
  }

  async deleteTopic(id) {
    // Check if there are questions attached
    const questionsCount = await prisma.question.count({ where: { topicId: id } });
    if (questionsCount > 0) {
      throw new AppError('No se puede eliminar un tema que tiene preguntas asociadas', 400);
    }
    return prisma.topic.delete({ where: { id } });
  }

  // --- Question Management ---
  async getAllQuestions() {
    return prisma.question.findMany({
      include: { 
        topic: { select: { title: true } } 
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to avoid performance issues in listing
    });
  }

  async createQuestion(data) {
    return prisma.question.create({ data });
  }

  async updateQuestion(id, data) {
    return prisma.question.update({ where: { id }, data });
  }

  async deleteQuestion(id) {
    return prisma.question.delete({ where: { id } });
  }
}

module.exports = new AdminService();
