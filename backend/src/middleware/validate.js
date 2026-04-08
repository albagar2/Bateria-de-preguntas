// ============================================
// Input Validation Middleware (Zod)
// ============================================
const { AppError } = require('../utils/AppError');

/**
 * Validate request body/params/query against a Zod schema
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'params'|'query'} source
 */
const validate = (schema, source = 'body') => {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return next(new AppError('Datos de entrada inválidos', 400, errors));
    }

    // Replace with parsed (sanitized) data
    req[source] = result.data;
    next();
  };
};

module.exports = { validate };
