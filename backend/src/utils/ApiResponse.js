/**
 * Standard API Response Utility
 */
class ApiResponse {
  static success(res, data, message = 'Operación completada con éxito', status = 200) {
    return res.status(status).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data, message = 'Recurso creado correctamente') {
    return this.success(res, data, message, 201);
  }
}

module.exports = { ApiResponse };
