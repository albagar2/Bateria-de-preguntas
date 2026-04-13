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
const subtopicController = require('../controllers/subtopicController');
const questionController = require('../controllers/questionController');
const testController = require('../controllers/testController');
const statsController = require('../controllers/statsController');
const studyPlanController = require('../controllers/studyPlanController');
const userController = require('../controllers/userController');
const oppositionController = require('../controllers/oppositionController');
const aiController = require('../controllers/aiController');
const adminController = require('../controllers/adminController');

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
router.post('/oppositions', authenticate, oppositionController.create);

// ─── Topic Routes ────────────────────────────
router.get('/topics', authenticate, topicController.getAll);
router.get('/topics/:id', authenticate, topicController.getById);
router.post('/topics', authenticate, validate(createTopicSchema), topicController.create);
router.put('/topics/:id', authenticate, validate(updateTopicSchema), topicController.update);
router.delete('/topics/:id', authenticate, authorize('ADMIN'), topicController.remove);

// ─── Subtopics ────────────────────────
router.get('/topics/:topicId/subtopics', authenticate, subtopicController.getByTopic);
router.post('/subtopics', authenticate, authorize('ADMIN'), subtopicController.create);
router.put('/subtopics/:id', authenticate, authorize('ADMIN'), subtopicController.update);
router.delete('/subtopics/:id', authenticate, authorize('ADMIN'), subtopicController.remove);

// ─── Question Routes ─────────────────────────
router.get('/questions', authenticate, questionController.getAll);
router.get('/questions/review', authenticate, questionController.getReviewQuestions);
router.get('/questions/no-fail/:topicId', authenticate, questionController.getNoFailMode);
router.get('/questions/:id', authenticate, authorize('ADMIN'), questionController.getById);
router.post('/questions', authenticate, validate(createQuestionSchema), questionController.create);
router.post('/questions/bulk', authenticate, authorize('ADMIN'), questionController.bulkCreate);
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
router.get('/study-plans/ai-advice', authenticate, studyPlanController.getAIAdvice);
router.patch('/study-plans/:id/complete', authenticate, studyPlanController.completePlan);

// ─── AI Routes ───────────────────────────────
router.post('/ai/explain', authenticate, aiController.generateExplanation);
router.post('/ai/ask', authenticate, aiController.askQuestion);

// ─── Admin Routes ───────────────────────────
router.get('/admin/stats', authenticate, authorize('ADMIN'), adminController.getSystemStats);
router.get('/admin/users', authenticate, authorize('ADMIN'), adminController.getAllUsers);
router.delete('/admin/users/:id', authenticate, authorize('ADMIN'), adminController.deleteUser);
router.patch('/admin/users/:id/role', authenticate, authorize('ADMIN'), adminController.updateUserRole);

// Admin Content Management
router.get('/admin/questions', authenticate, authorize('ADMIN'), adminController.getAllQuestions);
router.post('/admin/questions', authenticate, authorize('ADMIN'), adminController.createQuestion);
router.patch('/admin/questions/:id', authenticate, authorize('ADMIN'), adminController.updateQuestion);
router.delete('/admin/questions/:id', authenticate, authorize('ADMIN'), adminController.deleteQuestion);

router.post('/admin/topics', authenticate, authorize('ADMIN'), adminController.createTopic);
router.patch('/admin/topics/:id', authenticate, authorize('ADMIN'), adminController.updateTopic);
router.delete('/admin/topics/:id', authenticate, authorize('ADMIN'), adminController.deleteTopic);

module.exports = router;
