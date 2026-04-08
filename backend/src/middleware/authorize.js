// ============================================
// RBAC (Role-Based Access Control) Middleware
// ============================================
const { AppError } = require('../utils/AppError');

/**
 * Restrict route to specific roles
 * @param  {...string} roles - Allowed roles (e.g., 'ADMIN', 'USER')
 */
const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Autenticación requerida', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('No tienes permisos para realizar esta acción', 403));
    }

    next();
  };
};

module.exports = { authorize };
