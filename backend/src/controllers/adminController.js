const adminService = require('../services/adminService');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/ApiResponse');

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getAllUsers();
  return ApiResponse.success(res, users);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const result = await adminService.deleteUser(req.params.id);
  return ApiResponse.success(res, null, result.message);
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await adminService.updateUserRole(req.params.id, role);
  return ApiResponse.success(res, user, 'Rol actualizado con éxito');
});

exports.getSystemStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getSystemStats();
  return ApiResponse.success(res, stats);
});

// --- Question Management ---
exports.getAllQuestions = asyncHandler(async (req, res) => {
  const questions = await adminService.getAllQuestions();
  return ApiResponse.success(res, questions);
});

exports.createQuestion = asyncHandler(async (req, res) => {
  const question = await adminService.createQuestion(req.body);
  return ApiResponse.created(res, question, 'Pregunta creada con éxito');
});

exports.updateQuestion = asyncHandler(async (req, res) => {
  const question = await adminService.updateQuestion(req.params.id, req.body);
  return ApiResponse.success(res, question, 'Pregunta actualizada con éxito');
});

exports.deleteQuestion = asyncHandler(async (req, res) => {
  await adminService.deleteQuestion(req.params.id);
  return ApiResponse.success(res, null, 'Pregunta eliminada con éxito');
});

// --- Topic Management ---
exports.createTopic = asyncHandler(async (req, res) => {
  const topic = await adminService.createTopic(req.body);
  return ApiResponse.created(res, topic, 'Tema creado con éxito');
});

exports.updateTopic = asyncHandler(async (req, res) => {
  const topic = await adminService.updateTopic(req.params.id, req.body);
  return ApiResponse.success(res, topic, 'Tema actualizado con éxito');
});

exports.deleteTopic = asyncHandler(async (req, res) => {
  await adminService.deleteTopic(req.params.id);
  return ApiResponse.success(res, null, 'Tema eliminado con éxito');
});

