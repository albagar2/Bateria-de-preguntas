// ============================================
// Opposition Controller - Interface Layer
// ============================================
const oppositionService = require('../services/oppositionService');
const { asyncHandler } = require('../utils/asyncHandler');

const getAll = asyncHandler(async (_req, res) => {
  const opps = await oppositionService.getAll();
  res.json({ success: true, data: opps });
});

const getById = asyncHandler(async (req, res) => {
  const opp = await oppositionService.getById(req.params.id);
  res.json({ success: true, data: opp });
});

const create = asyncHandler(async (req, res) => {
  const opp = await oppositionService.create({ ...req.body, creatorId: req.user.id });
  res.status(201).json({
    success: true,
    message: 'Oposición creada correctamente',
    data: opp,
  });
});

module.exports = { getAll, getById, create };
