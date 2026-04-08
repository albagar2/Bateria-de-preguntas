// ============================================
// User Service - Application Layer
// Profile management, password change, deletion
// ============================================
const bcrypt = require('bcrypt');
const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

const SALT_ROUNDS = 12;

class UserService {
  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        examDate: true,
        darkMode: true,
        notifications: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError('Usuario no encontrado', 404);
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, data) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        examDate: true,
        darkMode: true,
        notifications: true,
      },
    });
  }

  /**
   * Change user password
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) throw new AppError('Usuario no encontrado', 404);

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AppError('Contraseña actual incorrecta', 401);
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({ where: { userId } });

    return { message: 'Contraseña actualizada correctamente' };
  }

  /**
   * Delete user account and all related data
   */
  async deleteAccount(userId, password) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) throw new AppError('Usuario no encontrado', 404);

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Contraseña incorrecta', 401);
    }

    // Cascade delete handles related records
    await prisma.user.delete({ where: { id: userId } });

    return { message: 'Cuenta eliminada correctamente' };
  }
}

module.exports = new UserService();
