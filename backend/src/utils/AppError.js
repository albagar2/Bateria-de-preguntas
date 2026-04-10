// ============================================
// AppError — Clase de error personalizada
// ============================================
// Extiende la clase Error nativa de JavaScript para incluir
// el código HTTP y distinguir errores "operacionales" de errores de programación.
//
// TIPOS DE ERRORES:
//   - Operacional (isOperational = true):
//     Errores esperados: "Email ya registrado", "Contraseña incorrecta", "No encontrado"
//     → Se muestran al cliente con su mensaje y código HTTP
//
//   - De programación (isOperational = false o Error genérico):
//     Errores inesperados: bugs, fallos de BD, null reference errors
//     → El middleware de errores (app.js) los captura y devuelve 500 genérico
//       SIN exponer detalles internos al cliente
//
// CÓMO USARLO:
//   throw new AppError('Mensaje para el usuario', 404);
//   throw new AppError('Datos inválidos', 400, [{ field: 'email', error: 'required' }]);
//
// EL FLUJO COMPLETO:
//   Servicio lanza AppError → asyncHandler lo pasa a next() → 
//   middleware de errores en app.js lo formatea y responde al cliente
// ============================================

class AppError extends Error {

  /**
   * Crea un error operacional con código HTTP.
   *
   * @param {string}     message    - Mensaje que se enviará al cliente
   * @param {number}     statusCode - Código HTTP: 400, 401, 403, 404, 409, 500...
   * @param {Array|null} errors     - Array opcional de errores de validación detallados
   *                                  Ej: [{ field: 'email', message: 'Email inválido' }]
   */
  constructor(message, statusCode = 500, errors = null) {
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;
    // isOperational = true indica que es un error esperado, no un bug
    // El middleware de errores usa este flag para decidir qué información exponer
    this.isOperational = true;

    // Captura el stack trace limpio (sin incluir este constructor)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
