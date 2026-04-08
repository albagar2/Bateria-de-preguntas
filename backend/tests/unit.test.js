// ============================================
// Backend Unit Tests - Auth & Utils
// ============================================
const { calculateSpacedRepetition, getQualityFromAnswer } = require('../src/utils/spacedRepetition');
const { AppError } = require('../src/utils/AppError');

// ─── AppError Tests ──────────────────────────
describe('AppError', () => {
  test('should create an error with default status code', () => {
    const error = new AppError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
    expect(error.errors).toBeNull();
  });

  test('should create an error with custom status code', () => {
    const error = new AppError('Not found', 404);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
  });

  test('should create an error with validation errors', () => {
    const validationErrors = [{ field: 'email', message: 'Invalid email' }];
    const error = new AppError('Validation failed', 400, validationErrors);
    expect(error.errors).toEqual(validationErrors);
    expect(error.statusCode).toBe(400);
  });

  test('should be an instance of Error', () => {
    const error = new AppError('Test');
    expect(error).toBeInstanceOf(Error);
  });
});

// ─── Spaced Repetition Tests ─────────────────
describe('Spaced Repetition Algorithm', () => {
  describe('calculateSpacedRepetition', () => {
    test('should reset interval on failure (quality < 3)', () => {
      const result = calculateSpacedRepetition(1, 2.5, 10);
      expect(result.nextInterval).toBe(1);
      expect(result.nextEaseFactor).toBeLessThan(2.5);
      expect(result.nextReview).toBeInstanceOf(Date);
    });

    test('should keep interval 1 for first correct answer', () => {
      const result = calculateSpacedRepetition(4, 2.5, 1);
      expect(result.nextInterval).toBe(1);
    });

    test('should set interval to 6 for second review', () => {
      const result = calculateSpacedRepetition(4, 2.5, 2);
      expect(result.nextInterval).toBe(6);
    });

    test('should multiply interval by ease factor for subsequent reviews', () => {
      const result = calculateSpacedRepetition(4, 2.5, 6);
      expect(result.nextInterval).toBe(15); // 6 * 2.5 = 15
    });

    test('should not go below ease factor 1.3', () => {
      const result = calculateSpacedRepetition(0, 1.3, 1);
      expect(result.nextEaseFactor).toBe(1.3);
    });

    test('should increase ease factor for perfect response', () => {
      const result = calculateSpacedRepetition(5, 2.5, 6);
      expect(result.nextEaseFactor).toBeGreaterThan(2.5);
    });

    test('should return a future date for nextReview', () => {
      const result = calculateSpacedRepetition(4, 2.5, 6);
      expect(result.nextReview.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('getQualityFromAnswer', () => {
    test('should return 1 for incorrect answers', () => {
      expect(getQualityFromAnswer(false)).toBe(1);
    });

    test('should return 4 for correct answers without time', () => {
      expect(getQualityFromAnswer(true)).toBe(4);
    });

    test('should return 5 for correct answers under 5 seconds', () => {
      expect(getQualityFromAnswer(true, 3000)).toBe(5);
    });

    test('should return 4 for correct answers under 15 seconds', () => {
      expect(getQualityFromAnswer(true, 12000)).toBe(4);
    });

    test('should return 3 for correct answers under 30 seconds', () => {
      expect(getQualityFromAnswer(true, 25000)).toBe(3);
    });

    test('should return 3 for slow correct answers', () => {
      expect(getQualityFromAnswer(true, 60000)).toBe(3);
    });
  });
});

// ─── Validation Schema Tests ─────────────────
describe('Validation Schemas', () => {
  const { registerSchema, loginSchema, createQuestionSchema } = require('../src/validators/schemas');

  describe('registerSchema', () => {
    test('should validate valid registration data', () => {
      const result = registerSchema.safeParse({
        name: 'Juan García',
        email: 'juan@example.com',
        password: 'Secure@Pass1',
      });
      expect(result.success).toBe(true);
    });

    test('should reject short password', () => {
      const result = registerSchema.safeParse({
        name: 'Juan',
        email: 'juan@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });

    test('should reject password without uppercase', () => {
      const result = registerSchema.safeParse({
        name: 'Juan',
        email: 'juan@example.com',
        password: 'lowercase@1',
      });
      expect(result.success).toBe(false);
    });

    test('should reject password without special character', () => {
      const result = registerSchema.safeParse({
        name: 'Juan',
        email: 'juan@example.com',
        password: 'NoSpecial1',
      });
      expect(result.success).toBe(false);
    });

    test('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        name: 'Juan',
        email: 'not-an-email',
        password: 'Secure@Pass1',
      });
      expect(result.success).toBe(false);
    });

    test('should trim and lowercase email', () => {
      const result = registerSchema.safeParse({
        name: '  Juan  ',
        email: '  JUAN@Example.COM  ',
        password: 'Secure@Pass1',
      });
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('juan@example.com');
      expect(result.data.name).toBe('Juan');
    });
  });

  describe('loginSchema', () => {
    test('should validate valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password',
      });
      expect(result.success).toBe(true);
    });

    test('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createQuestionSchema', () => {
    test('should validate valid question', () => {
      const result = createQuestionSchema.safeParse({
        topicId: '550e8400-e29b-41d4-a716-446655440000',
        questionText: '¿Cuál es la respuesta correcta?',
        options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        correctIndex: 2,
        explanation: 'La respuesta correcta es C',
        difficulty: 'MEDIUM',
      });
      expect(result.success).toBe(true);
    });

    test('should reject if correctIndex exceeds options length', () => {
      const result = createQuestionSchema.safeParse({
        topicId: '550e8400-e29b-41d4-a716-446655440000',
        questionText: '¿Pregunta?',
        options: ['A', 'B'],
        correctIndex: 5,
      });
      expect(result.success).toBe(false);
    });

    test('should reject less than 2 options', () => {
      const result = createQuestionSchema.safeParse({
        topicId: '550e8400-e29b-41d4-a716-446655440000',
        questionText: '¿Pregunta?',
        options: ['A'],
        correctIndex: 0,
      });
      expect(result.success).toBe(false);
    });
  });
});
