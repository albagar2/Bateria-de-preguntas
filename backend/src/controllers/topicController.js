// ============================================
// Topic Controller - Interface Layer
// ============================================
const topicService = require('../services/topicService');
const { asyncHandler } = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const oppositionIds = req.user?.oppositions?.map(o => o.id) || [];
  const ignoreOpposition = req.query.all === 'true' && req.user?.role === 'ADMIN';
  const topics = await topicService.getAll(userId, oppositionIds.length > 0 ? oppositionIds : null, ignoreOpposition);

  res.json({ success: true, data: topics });
});

const getById = asyncHandler(async (req, res) => {
  const topic = await topicService.getById(req.params.id, req.user?.id);

  res.json({ success: true, data: topic });
});

const create = asyncHandler(async (req, res) => {
  const data = {
    ...req.body,
    creatorId: req.user?.id,
    oppositionId: req.user?.oppositionId || req.body.oppositionId
  };
  const topic = await topicService.create(data);

  res.status(201).json({
    success: true,
    message: 'Tema creado correctamente',
    data: topic,
  });
});

const update = asyncHandler(async (req, res) => {
  const topic = await topicService.update(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Tema actualizado correctamente',
    data: topic,
  });
});

const remove = asyncHandler(async (req, res) => {
  await topicService.delete(req.params.id);

  res.json({
    success: true,
    message: 'Tema eliminado correctamente',
  });
});

module.exports = { getAll, getById, create, update, remove };
