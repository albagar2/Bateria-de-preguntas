// ============================================
// Server Entry Point
// ============================================
const app = require('./app');
const { env } = require('./config/env');
const { logger } = require('./config/logger');
const { prisma } = require('./config/database');

const PORT = env.PORT;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Init Achievements
    const achievementService = require('./services/achievementService');
    await achievementService.seedAchievements();
    logger.info('🏆 Achievements initialized');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
      logger.info(`📡 API: http://localhost:${PORT}/api/v1`);
      logger.info(`❤️  Health: http://localhost:${PORT}/api/v1/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database disconnected');
        process.exit(0);
      });

      // Force shutdown after 10s
      setTimeout(() => {
        logger.error('Forced shutdown after 10s timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Uncaught exception handler
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Support for Vercel Serverless
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
}

module.exports = app;
