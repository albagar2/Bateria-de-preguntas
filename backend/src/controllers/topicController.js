// ============================================
// Topic Controller — Capa interfaz HTTP
// ============================================
// Gestiona las peticiones HTTP relacionadas con los temas de estudio.
//
// RUTAS REGISTRADAS (routes/index.js):
//   GET    /topics        → getAll   (usuarios autenticados)
//   GET    /topics/:id    → getById  (usuarios autenticados)
//   POST   /topics        → create   (usuarios autenticados)
//   PUT    /topics/:id    → update   (usuarios autenticados)
//   DELETE /topics/:id    → remove   (solo ADMIN)
//
// FILTRADO POR OPOSICIÓN:
//   Este controlador extrae las oposiciones del usuario autenticado (req.user.oppositions)
//   y las pasa al servicio para filtrar los temas relevantes.
//   Los admins pueden pasar ?all=true para ver todos los temas.
// ============================================

const topicService = require('../services/topicService');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * GET /topics
 * GET /topics?all=true  (solo admin)
 *
 * Devuelve todos los temas activos filtrados por las oposiciones del usuario.
 *
 * Lógica de filtrado:
 *   - Usuario normal: ve solo los temas de sus oposiciones inscritas
 *   - Admin con ?all=true: ve todos los temas sin filtrar por oposición
 *   - Sin oposiciones inscritas: el array estará vacío → se pasa null al servicio
 *
 * El campo `progress` en cada tema se calcula si hay userId disponible.
 */
const getAll = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;

  // Extraer IDs de las oposiciones inscritas del usuario autenticado
  const oppositionIds = req.user?.oppositions?.map(o => o.id) || [];

  // Los admins pueden ver todos los temas pasando ?all=true en la query
  const ignoreOpposition = req.query.all === 'true' && req.user?.role === 'ADMIN';

  const topics = await topicService.getAll(
    userId,
    oppositionIds.length > 0 ? oppositionIds : null,
    ignoreOpposition
  );

  res.json({ success: true, data: topics });
});

/**
 * GET /topics/:id
 *
 * Devuelve un tema con sus preguntas (sin correctIndex por seguridad).
 * Ver topicService.getById para más detalle sobre el anti-cheat.
 */
const getById = asyncHandler(async (req, res) => {
  const topic = await topicService.getById(req.params.id, req.user?.id);

  res.json({ success: true, data: topic });
});

/**
 * POST /topics
 *
 * Crea un nuevo tema.
 * El `creatorId` se adjunta automáticamente desde el usuario autenticado.
 * El `oppositionId` puede venir en el body del request.
 *
 * NOTA: El campo req.user.oppositionId ya no existe (migración many-to-many).
 *       El oppositionId debe enviarse explícitamente en el body del request.
 */
const create = asyncHandler(async (req, res) => {
  const data = {
    ...req.body,
    // Registrar quién creó el tema para auditoría
    creatorId: req.user?.id,
  };
  const topic = await topicService.create(data);

  res.status(201).json({
    success: true,
    message: 'Tema creado correctamente',
    data: topic,
  });
});

/**
 * PUT /topics/:id
 *
 * Actualiza un tema existente con los datos del body.
 * La validación de campos viene del schema Zod (updateTopicSchema).
 */
const update = asyncHandler(async (req, res) => {
  const topic = await topicService.update(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Tema actualizado correctamente',
    data: topic,
  });
});

/**
 * DELETE /topics/:id  (solo ADMIN)
 *
 * Soft-delete: marca el tema como inactivo, no lo borra de la BD.
 * Para borrado físico desde el panel admin, usar DELETE /admin/topics/:id.
 * Ver topicService.delete para la diferencia entre soft y hard delete.
 */
const remove = asyncHandler(async (req, res) => {
  await topicService.delete(req.params.id);

  res.json({
    success: true,
    message: 'Tema eliminado correctamente',
  });
});

module.exports = { getAll, getById, create, update, remove };
