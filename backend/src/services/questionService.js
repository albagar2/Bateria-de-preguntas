// ============================================
// Question Service — Capa de lógica de negocio
// ============================================
// Gestiona preguntas: consultas, respuestas del usuario, y actualización
// del progreso mediante el algoritmo de repetición espaciada (SM-2).
//
// ALGORITMO DE REPETICIÓN ESPACIADA (Spaced Repetition):
//   Basado en el algoritmo SM-2. Cuando el usuario responde una pregunta,
//   se calcula cuándo debe revisarla de nuevo según si la respondió bien o mal.
//   - Respuesta correcta → intervalo crece (ej: 1 día → 3 días → 7 días → 21 días)
//   - Respuesta incorrecta → el intervalo se reinicia a 1 día
//   - Una pregunta se considera "dominada" (isMastered) cuando el intervalo >= 21 días
//   Para cambiar el algoritmo: editar utils/spacedRepetition.js
//
// TRANSACCIONES:
//   answerQuestion usa prisma.$transaction() para garantizar que el progreso,
//   los errores y la racha se actualizan de forma atómica. Si una operación
//   falla, todo se revierte (no hay datos parcialmente guardados).
//
// ANTI-CHEAT:
//   Los endpoints de consulta NO devuelven correctIndex.
//   La respuesta correcta solo se revela en answerQuestion (tras que el usuario responda).
// ============================================

const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');
const { calculateSpacedRepetition, getQualityFromAnswer } = require('../utils/spacedRepetition');

class QuestionService {

  /**
   * Obtiene preguntas con filtros opcionales y paginación.
   *
   * Parámetros de filtro:
   *   - topicId:    solo preguntas de ese tema
   *   - difficulty: solo preguntas de esa dificultad (EASY | MEDIUM | HARD)
   *   - page/limit: paginación para evitar cargar miles de preguntas de golpe
   *
   * La respuesta incluye el objeto `pagination` para que el cliente sepa
   * cuántas páginas hay y pueda implementar "cargar más" o paginación.
   *
   * @param {object} params - { topicId?, difficulty?, page, limit }
   * @returns {{ questions: [], pagination: {} }}
   */
  async getAll({ topicId, difficulty, page = 1, limit = 20 }) {
    const where = { isActive: true };
    if (topicId) where.topicId = topicId;
    if (difficulty) where.difficulty = difficulty;

    // Ejecutar count y findMany en paralelo para minimizar tiempo de respuesta
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          topic: { select: { id: true, title: true } },
        },
      }),
      prisma.question.count({ where }),
    ]);

    return {
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene una pregunta por ID con TODOS sus datos (incluyendo correctIndex).
   *
   * AVISO: Este endpoint solo debe estar disponible para ADMINs.
   * Ver questionController.getById y la ruta en routes/index.js.
   *
   * @param {string} id - UUID de la pregunta
   * @returns {object} Pregunta completa con correctIndex y explanation
   */
  async getById(id) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { topic: { select: { id: true, title: true } } },
    });

    if (!question) throw new AppError('Pregunta no encontrada', 404);
    return question;
  }

  /**
   * Obtiene preguntas para el Modo Sin Fallos de un tema específico.
   *
   * Las preguntas se devuelven en orden de creación (asc) para
   * una experiencia de estudio secuencial y predecible.
   *
   * NO incluye correctIndex (anti-cheat).
   * La respuesta correcta se obtiene en answerQuestion.
   *
   * @param {string}      topicId    - UUID del tema
   * @param {string}      userId     - UUID del usuario (no usado actualmente, para futuro)
   * @param {string|null} difficulty - Filtro opcional de dificultad
   * @returns {Array} Lista de preguntas sin correctIndex
   */
  async getNoFailModeQuestions(topicId, userId, difficulty = null) {
    const where = { topicId, isActive: true };
    if (difficulty) where.difficulty = difficulty;

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        questionText: true,
        options: true,
        difficulty: true,
        // correctIndex OMITIDO intencionalmente
      },
    });

    if (questions.length === 0) {
      throw new AppError('No hay preguntas disponibles para este tema', 404);
    }

    return questions;
  }

  /**
   * Obtiene preguntas pendientes de repaso según la repetición espaciada.
   *
   * Selecciona preguntas donde:
   *   - El usuario ya las ha respondido (existe UserProgress)
   *   - La fecha nextReview es hoy o anterior (está vencida)
   *   - No están marcadas como dominadas (isMastered = false)
   *
   * Si el usuario es nuevo o no ha respondido preguntas, devuelve array vacío.
   *
   * Para cambiar cuándo una pregunta se considera "debida", edita la lógica
   * en answerQuestion → cálculo de nextReview con spacedRepetition.js.
   *
   * @param {string} userId - UUID del usuario
   * @param {number} limit  - Máximo de preguntas a devolver (default: 20)
   * @returns {Array} Preguntas pendientes de repaso
   */
  async getReviewQuestions(userId, limit = 20) {
    const now = new Date();

    const dueProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        nextReview: { lte: now },   // Fecha de repaso pasada o hoy
        isMastered: false,           // Solo las que no están dominadas
      },
      include: {
        question: {
          select: {
            id: true,
            questionText: true,
            options: true,
            difficulty: true,
            topicId: true,
          },
        },
      },
      orderBy: { nextReview: 'asc' }, // Las más antiguas primero
      take: limit,
    });

    return dueProgress.map((p) => p.question);
  }

  /**
   * Procesa la respuesta del usuario a una pregunta.
   *
   * Operaciones en una transacción atómica:
   *   1. Calcula si la respuesta es correcta (selectedIndex === question.correctIndex)
   *   2. Calcula la "calidad" de la respuesta (correcta + rápida = calidad alta)
   *   3. Calcula el nuevo intervalo de repetición espaciada con SM-2
   *   4. Upsert del registro UserProgress (crea si no existe, actualiza si existe)
   *   5. Si falla: crea/actualiza el registro Mistake
   *      Si acierta: marca el Mistake correspondiente como resuelto (si existe)
   *   6. Actualiza la racha diaria del usuario (Streak)
   *
   * @param {string} userId  - UUID del usuario
   * @param {object} payload - { questionId, selectedIndex, responseTime (ms) }
   * @returns {{ isCorrect, correctIndex, explanation, progress }}
   */
  async answerQuestion(userId, { questionId, selectedIndex, responseTime }) {
    // Cargar la pregunta para obtener correctIndex (no lo tenía el cliente)
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) throw new AppError('Pregunta no encontrada', 404);

    const isCorrect = selectedIndex === question.correctIndex;

    // Calcular la "calidad" de la respuesta para el algoritmo SM-2
    // (correcto + tiempo rápido = mejor calidad = intervalo más largo)
    const quality = getQualityFromAnswer(isCorrect, responseTime);

    // Obtener el historial de esta pregunta para el usuario (puede no existir)
    const existingProgress = await prisma.userProgress.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });

    // Calcular nuevos valores de repetición espaciada
    const sr = calculateSpacedRepetition(
      quality,
      existingProgress?.easeFactor || 2.5,  // Factor de facilidad inicial: 2.5 (estándar SM-2)
      existingProgress?.interval || 1         // Intervalo inicial: 1 día
    );

    // Ejecutar todo en una transacción para garantizar consistencia
    const result = await prisma.$transaction(async (tx) => {
      // Upsert del progreso: crear si el usuario responde por primera vez, actualizar si ya existe
      const progress = await tx.userProgress.upsert({
        where: { userId_questionId: { userId, questionId } },
        create: {
          userId,
          questionId,
          isCorrect,
          attempts: 1,
          responseTime,
          nextReview: sr.nextReview,
          easeFactor: sr.nextEaseFactor,
          interval: sr.nextInterval,
          // Marcar como dominada si el intervalo llega a 21+ días (3 semanas)
          isMastered: isCorrect && sr.nextInterval >= 21,
        },
        update: {
          isCorrect,
          attempts: { increment: 1 },
          lastAttempt: new Date(),
          responseTime,
          nextReview: sr.nextReview,
          easeFactor: sr.nextEaseFactor,
          interval: sr.nextInterval,
          isMastered: isCorrect && sr.nextInterval >= 21,
        },
      });

      // Gestión de errores (Mistake)
      if (!isCorrect) {
        // Registrar o incrementar el error
        await tx.mistake.upsert({
          where: { userId_questionId: { userId, questionId } },
          create: { userId, questionId, mistakeCount: 1, isResolved: false },
          update: { mistakeCount: { increment: 1 }, lastMistake: new Date(), isResolved: false },
        });
      } else if (isCorrect && existingProgress) {
        // Si acierta y tenía un error previo, marcarlo como resuelto
        await tx.mistake.updateMany({
          where: { userId, questionId, isResolved: false },
          data: { isResolved: true },
        });
      }

      // Actualizar la racha diaria del usuario
      await this._updateStreak(tx, userId, isCorrect);

      return progress;
    });

    return {
      isCorrect,
      correctIndex: question.correctIndex,  // Ahora sí se revela la respuesta
      explanation: question.explanation,
      progress: result,
    };
  }

  /**
   * Crea una nueva pregunta (admin only).
   *
   * Verifica que el topicId exista antes de crear para dar un error
   * descriptivo (404) en lugar del error genérico de constraint de Prisma.
   *
   * @param {object} data - { topicId, questionText, options[], correctIndex, explanation?, difficulty? }
   * @returns {object} Pregunta creada
   */
  async create(data) {
    const topic = await prisma.topic.findUnique({ where: { id: data.topicId } });
    if (!topic) throw new AppError('Tema no encontrado', 404);

    if (data.subtopicId) {
      const subtopic = await prisma.subtopic.findUnique({ where: { id: data.subtopicId } });
      if (!subtopic || subtopic.topicId !== data.topicId) {
        throw new AppError('Subtema inválido para este tema', 400);
      }
    }

    return prisma.question.create({ data });
  }

  /**
   * Actualiza una pregunta existente (admin only).
   *
   * @param {string} id   - UUID de la pregunta
   * @param {object} data - Campos a actualizar (parcialmente)
   */
  async update(id, data) {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) throw new AppError('Pregunta no encontrada', 404);

    return prisma.question.update({ where: { id }, data });
  }

  /**
   * Soft-delete de una pregunta (admin only).
   *
   * Marca la pregunta como inactiva (isActive = false) en lugar de borrarla.
   * Esto preserva el historial de respuestas de los usuarios.
   *
   * Para borrado físico: usar adminService.deleteQuestion().
   *
   * @param {string} id - UUID de la pregunta
   */
  async delete(id) {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) throw new AppError('Pregunta no encontrada', 404);

    return prisma.question.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * INGESTA MASIVA DE PREGUNTAS (Bulk Import)
   * ----------------------------------------
   * Inserta un listado de preguntas de forma atómica y evita duplicados por texto.
   * 
   * Lógica de protección:
   * 1. Comprueba que el tema existe.
   * 2. Recupera todos los enunciados existentes en ese tema.
   * 3. Filtra la lista de entrada para descartar enunciados idénticos (case-insensitive).
   * 4. Inserta las preguntas restantes en una sola operación de BD.
   * 
   * @param {Array} questions - Lista de objetos de pregunta
   */
  async bulkCreate(questions) {
    if (!questions || questions.length === 0) {
      throw new AppError('No hay preguntas para importar', 400);
    }

    // Validamos que todas las preguntas tengan topicId (usamos el del primero como referencia)
    const topicId = questions[0].topicId;
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) throw new AppError('El tema especificado no existe', 404);

    // --- PROTECCIÓN CONTRA DUPLICADOS ---
    // Obtenemos textos de preguntas actuales para comparar
    const existingQuestions = await prisma.question.findMany({
      where: { topicId },
      select: { questionText: true }
    });
    
    // Set de normalización para búsqueda rápida O(1)
    const existingTexts = new Set(existingQuestions.map(q => q.questionText.trim().toLowerCase()));
    
    // Filtrado de preguntas de entrada
    const newQuestions = questions.filter(q => {
      const text = q.questionText.trim().toLowerCase();
      if (existingTexts.has(text)) {
        return false; // Salta si ya existe
      }
      existingTexts.add(text); // Añade al set para evitar duplicados dentro del mismo lote
      return true;
    });

    if (newQuestions.length === 0) {
      return { count: 0, message: 'Todas las preguntas ya existen en este tema.' };
    }

    // Inserción masiva aprovechando prisma.createMany (alto rendimiento)
    return prisma.question.createMany({
      data: newQuestions.map(q => ({
        questionText: q.questionText,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation || null,
        difficulty: q.difficulty || 'MEDIUM',
        topicId: topicId,
        subtopicId: q.subtopicId && q.subtopicId !== '' ? q.subtopicId : null,
      })),
      skipDuplicates: true
    });
  }

  // ─── Métodos Privados ───────────────────────

  /**
   * Actualiza la racha diaria y la racha sin fallos del usuario.
   *
   * Lógica de racha diaria:
   *   - Si es el primer estudio del día: suma 1 al streak
   *   - Si pasó exactamente 1 día (ayer): suma 1 (streak continúa)
   *   - Si pasaron 2+ días: resetea a 1 (streak roto)
   *   - Si es el mismo día: no cambia el streak (ya contó hoy)
   *
   * Lógica de racha sin fallos:
   *   - Correcto: +1 a currentNoFail
   *   - Incorrecto: resetea currentNoFail a 0
   *
   * Se ejecuta DENTRO de una transacción (tx) para garantizar consistencia.
   * Si falla, toda la transacción de answerQuestion se revierte.
   *
   * @param {object}  tx        - Cliente Prisma de la transacción activa
   * @param {string}  userId    - UUID del usuario
   * @param {boolean} isCorrect - Si la respuesta fue correcta
   */
  async _updateStreak(tx, userId, isCorrect) {
    const streak = await tx.streak.findUnique({ where: { userId } });
    if (!streak) return; // No debería ocurrir si el registro se creó en register()

    // Normalizar fechas a medianoche para comparar solo por día (sin hora)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastStudy = streak.lastStudyDate ? new Date(streak.lastStudyDate) : null;
    if (lastStudy) lastStudy.setHours(0, 0, 0, 0);

    let updates = { lastStudyDate: new Date() };

    // Calcular si la racha diaria debe sumar, reiniciarse, o mantenerse
    if (!lastStudy || lastStudy.getTime() !== today.getTime()) {
      if (lastStudy) {
        const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          updates.currentStreak = streak.currentStreak + 1; // Ayer estudió → continúa
        } else if (daysDiff > 1) {
          updates.currentStreak = 1; // Falta de días → racha rota, empieza en 1
        }
      } else {
        updates.currentStreak = 1; // Primera vez que estudia
      }

      // Actualizar el récord máximo si lo supera
      if ((updates.currentStreak || streak.currentStreak) > streak.maxStreak) {
        updates.maxStreak = updates.currentStreak || streak.currentStreak;
      }
    }

    // Racha sin fallos: se reinicia en cualquier error
    if (isCorrect) {
      updates.currentNoFail = streak.currentNoFail + 1;
      if (updates.currentNoFail > streak.maxNoFail) {
        updates.maxNoFail = updates.currentNoFail;
      }
    } else {
      updates.currentNoFail = 0; // Fallo → racha sin fallos a 0
    }

    await tx.streak.update({ where: { userId }, data: updates });
  }
}

module.exports = new QuestionService();
