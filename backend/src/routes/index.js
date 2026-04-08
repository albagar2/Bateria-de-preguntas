// ============================================
// API Routes - Interface Layer
// All route definitions with middleware
// ============================================
const { Router } = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/security');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  createTopicSchema,
  updateTopicSchema,
  createQuestionSchema,
  updateQuestionSchema,
  answerQuestionSchema,
  createTestSchema,
  submitTestAnswerSchema,
  createStudyPlanSchema,
  createBookmarkSchema,
} = require('../validators/schemas');

const authController = require('../controllers/authController');
const topicController = require('../controllers/topicController');
const questionController = require('../controllers/questionController');
const testController = require('../controllers/testController');
const statsController = require('../controllers/statsController');
const studyPlanController = require('../controllers/studyPlanController');
const userController = require('../controllers/userController');
const oppositionController = require('../controllers/oppositionController');

const router = Router();

// ─── Health Check ────────────────────────────
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

// ─── Auth Routes ─────────────────────────────
router.post('/auth/register', authLimiter, validate(registerSchema), authController.register);
router.post('/auth/login', authLimiter, validate(loginSchema), authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authController.logout);
router.post('/auth/logout-all', authenticate, authController.logoutAll);

// ─── User Routes ─────────────────────────────
router.get('/users/profile', authenticate, userController.getProfile);
router.patch('/users/profile', authenticate, validate(updateProfileSchema), userController.updateProfile);
router.post('/users/change-password', authenticate, validate(changePasswordSchema), userController.changePassword);
router.delete('/users/account', authenticate, userController.deleteAccount);

// ─── Opposition Routes ───────────────────────
router.get('/oppositions', optionalAuth, oppositionController.getAll);
router.get('/oppositions/:id', optionalAuth, oppositionController.getById);
router.post('/oppositions', authenticate, authorize('ADMIN'), oppositionController.create);

// ─── Topic Routes ────────────────────────────
router.get('/topics', authenticate, topicController.getAll);
router.get('/topics/:id', authenticate, topicController.getById);
router.post('/topics', authenticate, validate(createTopicSchema), topicController.create);
router.put('/topics/:id', authenticate, validate(updateTopicSchema), topicController.update);
router.delete('/topics/:id', authenticate, authorize('ADMIN'), topicController.remove);

// ─── Question Routes ─────────────────────────
router.get('/questions', authenticate, questionController.getAll);
router.get('/questions/review', authenticate, questionController.getReviewQuestions);
router.get('/questions/no-fail/:topicId', authenticate, questionController.getNoFailMode);
router.get('/questions/:id', authenticate, authorize('ADMIN'), questionController.getById);
router.post('/questions', authenticate, authorize('ADMIN'), validate(createQuestionSchema), questionController.create);
router.put('/questions/:id', authenticate, authorize('ADMIN'), validate(updateQuestionSchema), questionController.update);
router.delete('/questions/:id', authenticate, authorize('ADMIN'), questionController.remove);
router.post('/questions/answer', authenticate, validate(answerQuestionSchema), questionController.answer);

// ─── Test Routes ─────────────────────────────
router.post('/tests', authenticate, validate(createTestSchema), testController.create);
router.post('/tests/:testId/answer', authenticate, validate(submitTestAnswerSchema), testController.submitAnswer);
router.post('/tests/:testId/complete', authenticate, testController.complete);
router.get('/tests/history', authenticate, testController.getHistory);
router.get('/tests/:testId', authenticate, testController.getResult);

// ─── Stats Routes ────────────────────────────
router.get('/stats', authenticate, statsController.getStats);
router.get('/stats/mistakes', authenticate, statsController.getMistakes);
router.get('/stats/most-failed', authenticate, statsController.getMostFailed);
router.get('/stats/bookmarks', authenticate, statsController.getBookmarks);
router.post('/stats/bookmarks', authenticate, validate(createBookmarkSchema), statsController.toggleBookmark);
router.get('/stats/achievements', authenticate, statsController.getAchievements);
router.post('/stats/achievements/check', authenticate, statsController.checkAchievements);

// ─── Study Plan Routes ──────────────────────
router.post('/study-plans/generate', authenticate, validate(createStudyPlanSchema), studyPlanController.generate);
router.get('/study-plans', authenticate, studyPlanController.getPlans);
router.get('/study-plans/today', authenticate, studyPlanController.getTodayPlan);
router.patch('/study-plans/:id/complete', authenticate, studyPlanController.completePlan);

module.exports = router;
