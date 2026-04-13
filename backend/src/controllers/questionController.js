// ============================================
// Question Controller — Capa interfaz HTTP
// ============================================
// Gestiona las peticiones HTTP sobre preguntas.
//
// RUTAS REGISTRADAS (routes/index.js):
//   GET  /questions                      → getAll          (con filtros opcionales)
//   GET  /questions/:id                  → getById         (incluye correctIndex)
//   GET  /questions/no-fail/:topicId     → getNoFailMode   (sin correctIndex)
//   GET  /questions/review               → getReviewQuestions (repetición espaciada)
//   POST /questions/answer               → answer
//   POST /questions                      → create          (solo ADMIN)
//   PUT  /questions/:id                  → update          (solo ADMIN)
//   DELETE /questions/:id               → remove          (solo ADMIN)
//
// ANTI-CHEAT:
//   getAll y getNoFailMode NO devuelven correctIndex.
//   Solo se revela la respuesta correcta en answerQuestion (response data).
// ============================================

const questionService = require('../services/questionService');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * GET /questions
 * GET /questions?topicId=xxx&difficulty=EASY&page=1&limit=20
 *
 * Devuelve preguntas con paginación y filtros opcionales.
 * Los parámetros de query son todos opcionales:
 *   - topicId:    filtra por tema específico
 *   - difficulty: filtra por dificultad (EASY | MEDIUM | HARD)
 *   - page:       página de resultados (default 1)
 *   - limit:      resultados por página (default 20, max recomendado 100)
 *
 * Responde con: { questions: [], pagination: { page, limit, total, totalPages } }
 */
const getAll = asyncHandler(async (req, res) => {
  const { topicId, difficulty, page, limit } = req.query;
  const result = await questionService.getAll({
    topicId,
    difficulty,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });

  res.json({ success: true, data: result });
});

/**
 * GET /questions/:id
 *
 * Devuelve una pregunta completa incluyendo correctIndex y explanation.
 * Solo debe llamarse desde el panel de administración (requiere ADMIN).
 * Los estudiantes NUNCA deben poder llamar a este endpoint con el ID de una pregunta
 * que estén respondiendo, ya que revelaría la respuesta.
 */
const getById = asyncHandler(async (req, res) => {
  const question = await questionService.getById(req.params.id);

  res.json({ success: true, data: question });
});

/**
 * GET /questions/no-fail/:topicId
 * GET /questions/no-fail/:topicId?difficulty=HARD
 *
 * Devuelve todas las preguntas de un tema para el Modo Sin Fallos.
 * Las preguntas se presentan secuencialmente; si el usuario falla una,
 * vuelve al inicio (lógica implementada en el frontend - NoFailMode.jsx).
 *
 * NO incluye correctIndex (anti-cheat). La respuesta correcta se envía
 * pregunta a pregunta cuando el usuario responde → endpoint /questions/answer.
 */
const getNoFailMode = asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const { difficulty } = req.query;
  const questions = await questionService.getNoFailModeQuestions(
    topicId,
    req.user.id,
    difficulty
  );

  res.json({ success: true, data: questions });
});

/**
 * GET /questions/review
 * GET /questions/review?limit=30
 *
 * Devuelve preguntas pendientes de repaso según el algoritmo de repetición espaciada.
 * Solo mostrará preguntas cuya fecha `nextReview` sea hoy o anterior.
 * Si el usuario no tiene progreso, la respuesta será un array vacío.
 *
 * Para cambiar el algoritmo de espaciado: editar utils/spacedRepetition.js
 */
const getReviewQuestions = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const questions = await questionService.getReviewQuestions(req.user.id, limit);

  res.json({ success: true, data: questions });
});

/**
 * POST /questions/answer
 *
 * Registra la respuesta del usuario a una pregunta.
 * Body: { questionId, selectedIndex, responseTime }
 *
 * Hace varias cosas en una transacción:
 *   1. Calcula si la respuesta es correcta
 *   2. Actualiza el progreso del usuario (UserProgress) con algoritmo spaced repetition
 *   3. Si falla: añade/incrementa el error en Mistake
 *   4. Si acierta: marca el error como resuelto si existía
 *   5. Actualiza la racha diaria (Streak)
 *
 * Responde con: { isCorrect, correctIndex, explanation, progress }
 */
const answer = asyncHandler(async (req, res) => {
  const result = await questionService.answerQuestion(req.user.id, req.body);

  res.json({ success: true, data: result });
});

/**
 * POST /questions  (solo ADMIN)
 *
 * Crea una nueva pregunta.
 * Body: { topicId, questionText, options[], correctIndex, explanation, difficulty }
 * Verifica que el topicId referenciado exista antes de crear.
 */
const create = asyncHandler(async (req, res) => {
  const question = await questionService.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Pregunta creada correctamente',
    data: question,
  });
});

/**
 * PUT /questions/:id  (solo ADMIN)
 *
 * Actualiza una pregunta existente.
 * Body: campos a modificar (todos opcionales)
 */
const update = asyncHandler(async (req, res) => {
  const question = await questionService.update(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Pregunta actualizada correctamente',
    data: question,
  });
});

/**
 * DELETE /questions/:id  (solo ADMIN)
 *
 * Soft-delete: marca la pregunta como inactiva (isActive = false).
 * La pregunta deja de aparecer en tests y temas, pero el historial
 * de progreso de los usuarios que la respondieron se conserva.
 *
 * Para borrado físico: usar DELETE /admin/questions/:id (adminController)
 */
const remove = asyncHandler(async (req, res) => {
  await questionService.delete(req.params.id);

  res.json({
    success: true,
    message: 'Pregunta eliminada correctamente',
  });
});

/**
 * POST /questions/bulk  (solo ADMIN)
 * 
 * Crea múltiples preguntas a partir de un array.
 */
const bulkCreate = asyncHandler(async (req, res) => {
  const result = await questionService.bulkCreate(req.body);

  res.status(201).json({
    success: true,
    message: `${result.count} preguntas importadas correctamente`,
    data: result
  });
});

module.exports = { getAll, getById, getNoFailMode, getReviewQuestions, answer, create, update, remove, bulkCreate };
