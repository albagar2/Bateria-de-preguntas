// ============================================
// Auth Controller — Capa interfaz HTTP
// ============================================
// Actúa como puente entre las peticiones HTTP y el authService.
// Su único rol es: extraer datos de la req, llamar al servicio, y formatear la res.
//
// PATRÓN:
//   Toda la lógica de negocio está en authService.js.
//   Los controladores NO deben contener lógica de negocio.
//
// RUTAS REGISTRADAS (routes/index.js):
//   POST /auth/register    → register
//   POST /auth/login       → login
//   POST /auth/refresh     → refreshToken
//   POST /auth/logout      → logout
//   POST /auth/logout-all  → logoutAll (requiere authenticate)
//
// asyncHandler: wrapper que captura errores async y los pasa a next()
// sin necesidad de try/catch en cada controlador.
// ============================================

const authService = require('../services/authService');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * POST /auth/register
 *
 * Registra un nuevo usuario con nombre, email, contraseña y oposición opcional.
 * Los datos son validados por registerSchema (Zod) antes de llegar aquí.
 *
 * Responde con 201 Created + { user, accessToken, refreshToken }
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: 'Registro exitoso',
    data: result,
  });
});

/**
 * POST /auth/login
 *
 * Autentica al usuario y devuelve sus tokens.
 * Extrae userAgent e IP para registrar la sesión en la BD (auditoría).
 *
 * Si el login falla (credenciales inválidas), el servicio lanza AppError(401).
 * Responde con 200 OK + { user, accessToken, refreshToken }
 */
const login = asyncHandler(async (req, res) => {
  // Datos de auditoría: desde qué cliente y dirección IP se inicia sesión
  const userAgent = req.headers['user-agent'] || null;
  const ipAddress = req.ip || req.connection?.remoteAddress || null;

  const result = await authService.login(req.body, userAgent, ipAddress);

  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    data: result,
  });
});

/**
 * POST /auth/refresh
 *
 * Renueva el access token usando el refresh token.
 * El cliente lo llama cuando recibe un 401 en cualquier otra petición.
 * Ver api.js → tryRefreshToken() para el flujo completo del frontend.
 *
 * Body: { refreshToken: string }
 * Responde con: { accessToken, user }
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  const result = await authService.refreshToken(token);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * POST /auth/logout
 *
 * Cierra la sesión actual. No requiere autenticación obligatoria
 * porque el refresh token es la única referencia a la sesión.
 *
 * Body: { refreshToken: string }
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  await authService.logout(token);

  res.json({
    success: true,
    message: 'Sesión cerrada correctamente',
  });
});

/**
 * POST /auth/logout-all
 *
 * Cierra TODAS las sesiones activas del usuario en todos sus dispositivos.
 * Requiere autenticación (middleware authenticate) → req.user está disponible.
 *
 * Útil cuando el usuario sospecha que su cuenta ha sido comprometida.
 */
const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);

  res.json({
    success: true,
    message: 'Todas las sesiones han sido cerradas',
  });
});

module.exports = { register, login, refreshToken, logout, logoutAll };
