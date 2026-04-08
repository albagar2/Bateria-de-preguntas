// ============================================
// Opposition Service - Application Layer
// ============================================
const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

class OppositionService {
  async getAll() {
    return prisma.opposition.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getById(id) {
    const opp = await prisma.opposition.findUnique({
      where: { id },
    });
    if (!opp) throw new AppError('Oposición no encontrada', 404);
    return opp;
  }

  async create(data) {
    return prisma.opposition.create({ data });
  }
}

module.exports = new OppositionService();
