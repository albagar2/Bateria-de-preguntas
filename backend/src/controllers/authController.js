// ============================================
// Auth Controller - Interface Layer
// ============================================
const authService = require('../services/authService');
const { asyncHandler } = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: 'Registro exitoso',
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const userAgent = req.headers['user-agent'] || null;
  const ipAddress = req.ip || req.connection?.remoteAddress || null;

  const result = await authService.login(req.body, userAgent, ipAddress);

  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    data: result,
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  const result = await authService.refreshToken(token);

  res.json({
    success: true,
    data: result,
  });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  await authService.logout(token);

  res.json({
    success: true,
    message: 'Sesión cerrada correctamente',
  });
});

const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);

  res.json({
    success: true,
    message: 'Todas las sesiones han sido cerradas',
  });
});

module.exports = { register, login, refreshToken, logout, logoutAll };
