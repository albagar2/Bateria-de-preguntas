// ============================================
// Zod Validation Schemas
// Strong typing for all API inputs
// ============================================
const { z } = require('zod');

// ─── Auth Schemas ────────────────────────────
const registerSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Email inválido')
    .max(255),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
  oppositionId: z.union([z.string().uuid(), z.array(z.string().uuid())]).optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// ─── User Schemas ────────────────────────────
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  examDate: z.string().datetime().optional().nullable(),
  darkMode: z.boolean().optional(),
  notifications: z.boolean().optional(),
  oppositionId: z.union([z.string().uuid(), z.array(z.string().uuid())]).optional().nullable(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(128)
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
});

// ─── Topic Schemas ───────────────────────────
const createTopicSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  order: z.number().int().min(0).default(0),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (formato: #RRGGBB)').optional(),
  oppositionId: z.string().uuid().optional(),
});

const updateTopicSchema = createTopicSchema.partial();

// ─── Question Schemas ────────────────────────
const createQuestionSchema = z.object({
  topicId: z.string().uuid('ID de tema inválido'),
  questionText: z.string().min(5, 'La pregunta debe tener al menos 5 caracteres').max(2000).trim(),
  options: z.array(z.string().min(1).max(500).trim())
    .min(2, 'Se necesitan al menos 2 opciones')
    .max(6, 'Máximo 6 opciones'),
  correctIndex: z.number().int().min(0),
  explanation: z.string().max(2000).trim().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
}).refine(
  (data) => data.correctIndex < data.options.length,
  { message: 'El índice de respuesta correcta debe ser válido', path: ['correctIndex'] }
);

const updateQuestionSchema = z.object({
  questionText: z.string().min(5).max(2000).trim().optional(),
  options: z.array(z.string().min(1).max(500).trim()).min(2).max(6).optional(),
  correctIndex: z.number().int().min(0).optional(),
  explanation: z.string().max(2000).trim().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
});

// ─── Answer Schema ───────────────────────────
const answerQuestionSchema = z.object({
  questionId: z.string().uuid('ID de pregunta inválido'),
  selectedIndex: z.number().int().min(0),
  responseTime: z.number().int().min(0).optional(), // ms
});

// ─── Test Schemas ────────────────────────────
const createTestSchema = z.object({
  type: z.enum(['QUICK', 'TOPIC', 'EXAM_SIMULATION', 'ERROR_REVIEW', 'CUSTOM']).default('QUICK'),
  topicIds: z.array(z.string().uuid()).optional(),
  totalQuestions: z.number().int().min(5).max(200).default(20),
  timeLimit: z.number().int().min(60).max(14400).optional().nullable(), // seconds (1m to 4h)
  penalizeErrors: z.boolean().default(false),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
});

const submitTestAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedIndex: z.number().int().min(0).nullable(),
  responseTime: z.number().int().min(0).optional(),
});

// ─── Study Plan Schemas ──────────────────────
const createStudyPlanSchema = z.object({
  examDate: z.string().datetime('Fecha de examen inválida'),
  topicIds: z.array(z.string().uuid()).min(1, 'Selecciona al menos un tema'),
});

// ─── Bookmark Schema ─────────────────────────
const createBookmarkSchema = z.object({
  questionId: z.string().uuid(),
  note: z.string().max(500).trim().optional(),
});

// ─── Pagination ──────────────────────────────
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).trim().optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

module.exports = {
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
  paginationSchema,
};
