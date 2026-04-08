// ============================================
// Test Controller - Interface Layer
// ============================================
const testService = require('../services/testService');
const { asyncHandler } = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const test = await testService.create(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: 'Test creado correctamente',
    data: test,
  });
});

const submitAnswer = asyncHandler(async (req, res) => {
  const result = await testService.submitAnswer(
    req.user.id,
    req.params.testId,
    req.body
  );

  res.json({ success: true, data: result });
});

const complete = asyncHandler(async (req, res) => {
  const result = await testService.complete(req.user.id, req.params.testId);

  res.json({
    success: true,
    message: 'Test completado',
    data: result,
  });
});

const getHistory = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await testService.getHistory(req.user.id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
  });

  res.json({ success: true, data: result });
});

const getResult = asyncHandler(async (req, res) => {
  const test = await testService.getResult(req.user.id, req.params.testId);

  res.json({ success: true, data: test });
});

module.exports = { create, submitAnswer, complete, getHistory, getResult };
