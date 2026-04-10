// ============================================
// Auth Service - Application Layer
// Handles registration, login, token management
// ============================================
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { env } = require('../config/env');
const { AppError } = require('../utils/AppError');
const { logger } = require('../config/logger');

const SALT_ROUNDS = 12;

class AuthService {
  /**
   * Register a new user
   */
  async register({ name, email, password, oppositionId }) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Ya existe una cuenta con este email', 409);
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user and streak in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          oppositionId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          oppositionId: true,
          createdAt: true,
        },
      });

      // Initialize streak tracking
      await tx.streak.create({
        data: {
          userId: newUser.id,
          currentStreak: 0,
          maxStreak: 0,
          currentNoFail: 0,
          maxNoFail: 0,
        },
      });

      return newUser;
    });

    // Generate tokens
    const tokens = await this._generateTokens(user);

    logger.info(`User registered: ${user.id}`);

    return { user, ...tokens };
  }

  /**
   * Login an existing user
   */
  async login({ email, password }, userAgent, ipAddress) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        oppositionId: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    if (!user) {
      // Use same message for security (don't reveal if email exists)
      throw new AppError('Credenciales inválidas', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Generate tokens
    const tokens = await this._generateTokens(user, userAgent, ipAddress);

    // Remove password hash from response
    const { passwordHash: _, ...safeUser } = user;

    logger.info(`User logged in: ${user.id}`);

    return { user: safeUser, ...tokens };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Refresh token no proporcionado', 401);
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Refresh token inválido o expirado', 401);
    }

    // Check session exists
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, oppositionId: true },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      // Clean up expired session
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      throw new AppError('Sesión expirada. Inicia sesión de nuevo', 401);
    }

    // Generate new access token
    const accessToken = this._signAccessToken(session.user);

    return { accessToken, user: session.user };
  }

  /**
   * Logout — invalidate refresh token
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await prisma.session.deleteMany({
        where: { refreshToken },
      }).catch(() => {
        // Session might not exist, that's ok
      });
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId) {
    await prisma.session.deleteMany({
      where: { userId },
    });
    logger.info(`All sessions revoked for user: ${userId}`);
  }

  // ─── Private Methods ────────────────────────

  _signAccessToken(user) {
    return jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  async _generateTokens(user, userAgent = null, ipAddress = null) {
    const accessToken = this._signAccessToken(user);

    const refreshToken = jwt.sign(
      { userId: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Store refresh token in session table
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    // Clean up old sessions (keep max 5 per user)
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (sessions.length > 5) {
      const toDelete = sessions.slice(5).map((s) => s.id);
      await prisma.session.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();
