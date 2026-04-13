const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

class SubtopicService {
  async getAllByTopic(topicId) {
    return prisma.subtopic.findMany({
      where: { topicId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });
  }

  async create(data) {
    const topic = await prisma.topic.findUnique({ where: { id: data.topicId } });
    if (!topic) throw new AppError('Tema no encontrado', 404);
    
    return prisma.subtopic.create({ data });
  }

  async update(id, data) {
    const subtopic = await prisma.subtopic.findUnique({ where: { id } });
    if (!subtopic) throw new AppError('Subtema no encontrado', 404);
    
    return prisma.subtopic.update({ where: { id }, data });
  }

  async delete(id) {
    const subtopic = await prisma.subtopic.findUnique({ where: { id } });
    if (!subtopic) throw new AppError('Subtema no encontrado', 404);
    
    return prisma.subtopic.delete({ where: { id } });
  }
}

module.exports = new SubtopicService();
