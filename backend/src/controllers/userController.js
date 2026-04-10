// ============================================
// User Controller — Capa interfaz HTTP
// ============================================
// Gestiona las peticiones HTTP del perfil del usuario autenticado.
//
// RUTAS REGISTRADAS (routes/index.js) — todas requieren authenticate:
//   GET    /users/profile            → getProfile
//   PATCH  /users/profile            → updateProfile
//   POST   /users/change-password    → changePassword
//   DELETE /users/account            → deleteAccount
//
// En todas estas rutas, req.user está disponible (inyectado por authenticate).
// El userId siempre viene de req.user.id (no del body) para evitar
// que un usuario pueda modificar el perfil de otro.
// ============================================

const userService = require('../services/userService');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * GET /users/profile
 *
 * Devuelve el perfil completo del usuario autenticado.
 * Incluye: datos personales, oposiciones inscritas, preferencias (darkMode, notifications).
 * Usado por: AuthContext en el frontend al cargar la app para restaurar la sesión.
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);

  res.json({ success: true, data: user });
});

/**
 * PATCH /users/profile
 *
 * Actualiza parcialmente el perfil del usuario.
 * Puede actualizarse cualquier combinación de campos: name, examDate, darkMode,
 * notifications, oppositionId (string o array de IDs).
 *
 * La validación de los campos viene del schema Zod (updateProfileSchema).
 * Ver userService.updateProfile para el manejo especial de oppositionId.
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);

  res.json({
    success: true,
    message: 'Perfil actualizado correctamente',
    data: user,
  });
});

/**
 * POST /users/change-password
 *
 * Cambia la contraseña del usuario tras verificar la contraseña actual.
 * Body: { currentPassword, newPassword }
 *
 * Tras el cambio, todas las sesiones activas se invalidan → el usuario
 * deberá hacer login de nuevo en todos sus dispositivos (por seguridad).
 */
const changePassword = asyncHandler(async (req, res) => {
  const result = await userService.changePassword(req.user.id, req.body);

  res.json({ success: true, ...result });
});

/**
 * DELETE /users/account
 *
 * Elimina permanentemente la cuenta del usuario y todos sus datos.
 * Body: { password } (confirmación obligatoria)
 *
 * AVISO: Acción irreversible. Ver userService.deleteAccount para detalles
 * sobre qué datos se borran en cascada.
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const result = await userService.deleteAccount(req.user.id, password);

  res.json({ success: true, ...result });
});

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
