// ============================================
// Async Handler - Wraps async route handlers
// ============================================

/**
 * Wraps async express route handlers to catch errors
 * @param {Function} fn - Async route handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
