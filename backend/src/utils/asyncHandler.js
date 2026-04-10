// ============================================
// asyncHandler — Wrapper para controladores async
// ============================================
// Elimina la necesidad de escribir try/catch en cada controlador de Express.
//
// PROBLEMA QUE RESUELVE:
//   En Express, si un controlador async lanza un error, Express NO lo captura
//   automáticamente. Habría que hacer try/catch en cada función:
//
//     const myController = async (req, res, next) => {
//       try {
//         // lógica
//       } catch (err) {
//         next(err); // sin esto, el error queda "colgado"
//       }
//     };
//
// CON asyncHandler:
//     const myController = asyncHandler(async (req, res) => {
//       // Si esto lanza un error, asyncHandler llama a next(err) automáticamente
//       const data = await service.getData();
//       res.json({ data });
//     });
//
// FLUJO:
//   asyncHandler envuelve la función async → si Promise rechaza → llama a next(err)
//   → El middleware de errores global en app.js recibe el error y lo formatea
//
// PARA AÑADIR LÓGICA COMPARTIDA (ej: logging de todas las peticiones):
//   Puedes añadirla aquí, aunque se recomienda hacerlo con middleware separado.
// ============================================

/**
 * Envuelve un controlador async para capturar errores automáticamente.
 *
 * @param {Function} fn - Función async del controlador (req, res, next) => Promise
 * @returns {Function}  - Función sincrónica compatible con Express que maneja el error
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
