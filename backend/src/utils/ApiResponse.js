// ============================================
// ApiResponse — Utilidad de respuestas HTTP
// ============================================
// Centraliza el formato de todas las respuestas exitosas de la API.
//
// FORMATO ESTÁNDAR DE RESPUESTA:
//   {
//     success: true,
//     message: "Mensaje descriptivo",
//     data: { ... } | null
//   }
//
// LOS ERRORES se manejan de forma diferente:
//   - Los lanza AppError desde los servicios
//   - Los captura asyncHandler y los pasa a next()
//   - Los formatea el middleware de errores global en app.js
//
// DÓNDE SE USA:
//   Principalmente en adminController.js. Los demás controladores
//   usan res.json() directamente por simplicidad. Ambos enfoques son válidos.
//
// PARA AÑADIR NUEVOS FORMATOS (ej: paginación estándar):
//   Añade un método estático como: static paginated(res, data, pagination) { ... }
// ============================================

class ApiResponse {

  /**
   * Respuesta de éxito genérica.
   *
   * @param {object} res     - Objeto response de Express
   * @param {any}    data    - Datos a devolver (objeto, array, o null)
   * @param {string} message - Mensaje descriptivo de la operación
   * @param {number} status  - Código HTTP (default: 200)
   */
  static success(res, data, message = 'Operación completada con éxito', status = 200) {
    return res.status(status).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Respuesta de recurso creado (HTTP 201 Created).
   * Atajo para las operaciones POST que crean un nuevo registro.
   *
   * @param {object} res     - Objeto response de Express
   * @param {any}    data    - El recurso recién creado
   * @param {string} message - Mensaje descriptivo
   */
  static created(res, data, message = 'Recurso creado correctamente') {
    return this.success(res, data, message, 201);
  }
}

module.exports = { ApiResponse };
