// ============================================
// Question Controller - Interface Layer
// ============================================
const questionService = require('../services/questionService');
const { asyncHandler } = require('../utils/asyncHandler');

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

const getById = asyncHandler(async (req, res) => {
  const question = await questionService.getById(req.params.id);

  res.json({ success: true, data: question });
});

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

const getReviewQuestions = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const questions = await questionService.getReviewQuestions(req.user.id, limit);

  res.json({ success: true, data: questions });
});

const answer = asyncHandler(async (req, res) => {
  const result = await questionService.answerQuestion(req.user.id, req.body);

  res.json({ success: true, data: result });
});

const create = asyncHandler(async (req, res) => {
  const question = await questionService.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Pregunta creada correctamente',
    data: question,
  });
});

const update = asyncHandler(async (req, res) => {
  const question = await questionService.update(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Pregunta actualizada correctamente',
    data: question,
  });
});

const remove = asyncHandler(async (req, res) => {
  await questionService.delete(req.params.id);

  res.json({
    success: true,
    message: 'Pregunta eliminada correctamente',
  });
});

module.exports = {
  getAll,
  getById,
  getNoFailMode,
  getReviewQuestions,
  answer,
  create,
  update,
  remove,
};
