// ============================================
// JWT Authentication Middleware
// Verifies access tokens and attaches user
// ============================================
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

/**
 * Authenticate requests via Bearer token
 */
const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token de autenticación no proporcionado', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Token de autenticación inválido', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token expirado. Por favor, inicia sesión de nuevo', 401);
      }
      throw new AppError('Token inválido', 401);
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication — doesn't fail if no token
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true },
      });
      if (user) req.user = user;
    } catch {
      // Silently continue without auth
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate, optionalAuth };
