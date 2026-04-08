// ============================================
// Global Error Handler
// Catches all errors and returns safe responses
// ============================================
const { env } = require('../config/env');
const { logger } = require('../config/logger');
const { AppError } = require('../utils/AppError');

/**
 * Global error handling middleware
 */
const errorHandler = (err, _req, res, _next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let errors = err.errors || null;

  // Prisma specific errors
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'Ya existe un registro con estos datos';
    errors = null;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Registro no encontrado';
    errors = null;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Log server errors (not client errors)
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${message}`, {
      stack: err.stack,
      // Never log sensitive request data
    });
  } else {
    logger.warn(`[${statusCode}] ${message}`);
  }

  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

/**
 * Handle 404 routes
 */
const notFoundHandler = (req, _res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = { errorHandler, notFoundHandler };
