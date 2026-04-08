// ============================================
// Stats Controller - Interface Layer
// ============================================
const statsService = require('../services/statsService');
const { asyncHandler } = require('../utils/asyncHandler');

const getStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getUserStats(req.user.id);

  res.json({ success: true, data: stats });
});

const getMistakes = asyncHandler(async (req, res) => {
  const { topicId, page, limit } = req.query;
  const result = await statsService.getMistakes(req.user.id, {
    topicId,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });

  res.json({ success: true, data: result });
});

const getMostFailed = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const result = await statsService.getMostFailed(req.user.id, limit);

  res.json({ success: true, data: result });
});

const getBookmarks = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await statsService.getBookmarks(req.user.id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });

  res.json({ success: true, data: result });
});

const toggleBookmark = asyncHandler(async (req, res) => {
  const { questionId, note } = req.body;
  const result = await statsService.toggleBookmark(req.user.id, questionId, note);

  res.json({
    success: true,
    message: result.bookmarked ? 'Pregunta marcada' : 'Marcador eliminado',
    data: result,
  });
});

const getAchievements = asyncHandler(async (req, res) => {
  const achievements = await statsService.getAchievements(req.user.id);

  res.json({ success: true, data: achievements });
});

const checkAchievements = asyncHandler(async (req, res) => {
  const newAchievements = await statsService.checkAchievements(req.user.id);

  res.json({
    success: true,
    data: {
      newlyUnlocked: newAchievements,
      hasNew: newAchievements.length > 0,
    },
  });
});

module.exports = {
  getStats,
  getMistakes,
  getMostFailed,
  getBookmarks,
  toggleBookmark,
  getAchievements,
  checkAchievements,
};
