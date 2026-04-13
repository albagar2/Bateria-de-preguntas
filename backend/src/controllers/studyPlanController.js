// ============================================
// Study Plan Controller - Interface Layer
// ============================================
const studyPlanService = require('../services/studyPlanService');
const { asyncHandler } = require('../utils/asyncHandler');

const generate = asyncHandler(async (req, res) => {
  const result = await studyPlanService.generate(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: 'Plan de estudio generado correctamente',
    data: result,
  });
});

const getPlans = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const plans = await studyPlanService.getPlans(req.user.id, { startDate, endDate });

  res.json({ success: true, data: plans });
});

const getTodayPlan = asyncHandler(async (req, res) => {
  const plan = await studyPlanService.getTodayPlan(req.user.id);

  res.json({ success: true, data: plan });
});

const completePlan = asyncHandler(async (req, res) => {
  const plan = await studyPlanService.completePlan(req.user.id, req.params.id);

  res.json({
    success: true,
    message: 'Plan marcado como completado',
    data: plan,
  });
});

const getAIAdvice = asyncHandler(async (req, res) => {
  const result = await studyPlanService.getAIAdvice(req.user.id);
  res.json({ success: true, data: result });
});

module.exports = { generate, getPlans, getTodayPlan, completePlan, getAIAdvice };
