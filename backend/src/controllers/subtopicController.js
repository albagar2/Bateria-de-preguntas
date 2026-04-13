const subtopicService = require('../services/subtopicService');
const { asyncHandler } = require('../utils/asyncHandler');

const getByTopic = asyncHandler(async (req, res) => {
  const subtopics = await subtopicService.getAllByTopic(req.params.topicId);
  res.json({ success: true, data: subtopics });
});

const create = asyncHandler(async (req, res) => {
  const subtopic = await subtopicService.create(req.body);
  res.status(201).json({ success: true, data: subtopic });
});

const update = asyncHandler(async (req, res) => {
  const subtopic = await subtopicService.update(req.params.id, req.body);
  res.json({ success: true, data: subtopic });
});

const remove = asyncHandler(async (req, res) => {
  await subtopicService.delete(req.params.id);
  res.json({ success: true, message: 'Subtema eliminado' });
});

module.exports = { getByTopic, create, update, remove };
