// ============================================
// Opposition Controller — Capa interfaz HTTP
// ============================================
// Gestiona las peticiones HTTP sobre oposiciones.
//
// RUTAS REGISTRADAS (routes/index.js):
//   GET  /oppositions      → getAll  (pública, sin autenticación)
//   GET  /oppositions/:id  → getById (pública)
//   POST /oppositions      → create  (requiere autenticación)
//
// Las rutas GET son públicas para que los usuarios puedan ver las
// oposiciones disponibles ANTES de registrarse o al editar su perfil.
// ============================================

const oppositionService = require('../services/oppositionService');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * GET /oppositions
 *
 * Devuelve todas las oposiciones disponibles, ordenadas alfabéticamente.
 * Ruta pública: accesible sin token de autenticación.
 * Usada en: formulario de registro, selector de perfil.
 */
const getAll = asyncHandler(async (_req, res) => {
  const opps = await oppositionService.getAll();
  res.json({ success: true, data: opps });
});

/**
 * GET /oppositions/:id
 *
 * Devuelve los datos de una oposición específica.
 * Ruta pública. Puede usarse para mostrar detalles de una oposición.
 *
 * @param {string} req.params.id - UUID de la oposición
 */
const getById = asyncHandler(async (req, res) => {
  const opp = await oppositionService.getById(req.params.id);
  res.json({ success: true, data: opp });
});

/**
 * POST /oppositions
 *
 * Crea una nueva oposición.
 * Requiere autenticación. El creatorId se adjunta automáticamente desde req.user.id.
 *
 * Body: { name, description?, icon? }
 *
 * Casos de uso:
 *   - Un admin crea oposiciones para toda la plataforma
 *   - Un usuario crea una oposición personalizada que no encuentra en el listado
 *
 * Para restringir la creación solo a admins: añadir authorize('ADMIN') en la ruta
 * correspondiente en routes/index.js.
 */
const create = asyncHandler(async (req, res) => {
  const opp = await oppositionService.create({
    ...req.body,
    // El creador queda registrado para saber quién añadió la oposición
    creatorId: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: 'Oposición creada correctamente',
    data: opp,
  });
});

module.exports = { getAll, getById, create };
