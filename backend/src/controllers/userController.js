// ============================================
// User Controller - Interface Layer
// ============================================
const userService = require('../services/userService');
const { asyncHandler } = require('../utils/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);

  res.json({ success: true, data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);

  res.json({
    success: true,
    message: 'Perfil actualizado correctamente',
    data: user,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const result = await userService.changePassword(req.user.id, req.body);

  res.json({ success: true, ...result });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const result = await userService.deleteAccount(req.user.id, password);

  res.json({ success: true, ...result });
});

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
