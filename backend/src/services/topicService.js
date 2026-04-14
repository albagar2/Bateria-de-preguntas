// ============================================
// Topic Service — Capa de lógica de negocio
// ============================================
// Gestiona la consulta y mantenimiento de los temas de estudio.
//
// MODELO DE DATOS (schema.prisma):
//   Un Topic pertenece a una Opposition (oppositionId) en relación uno-a-muchos.
//   Un Topic tiene muchas Questions (relación Topic→Question).
//   Un Topic puede tener isActive = false (soft delete) para ocultarlo sin borrar datos.
//
// FILTRADO POR OPOSICIÓN:
//   Los usuarios solo ven temas de sus oposiciones inscritas.
//   Los admins pueden ver todos los temas pasando ?all=true en la query.
//   La lógica de filtrado está en topicController.js y se pasa aquí como parámetro.
// ============================================

const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

class TopicService {

  /**
   * Obtiene todos los temas activos con su progreso del usuario.
   *
   * Parámetros:
   *   - userId: si se proporciona, calcula y adjunta el progreso del usuario
   *             en cada tema (preguntas correctas, dominadas, porcentaje)
   *   - oppositionId: puede ser un array (multi-oposición) o null.
   *             Si es un array, filtra temas de cualquiera de esas oposiciones.
   *             Si es null y ignoreOpposition=false, busca temas sin oposición.
   *   - ignoreOpposition: si es true (solo admins), devuelve todos los temas
   *             independientemente de la oposición.
   *
   * El progreso se calcula en memoria (no en SQL) porque necesitamos cruzar
   * el progreso del usuario con cada tema. Si hay muchos temas/preguntas,
   * considerar hacer esta lógica directamente en Prisma con agregaciones.
   *
   * @param {string|null}        userId         - UUID del usuario (o null)
   * @param {string[]|string|null} oppositionId - Array de IDs, un ID, o null
   * @param {boolean}            ignoreOpposition - true para ver todos (solo admin)
   * @returns {Array} Lista de temas con campo extra de progreso si userId presente
   */
  async getAll(userId = null, oppositionId = null, ignoreOpposition = false) {
    const where = { isActive: true };

    if (!ignoreOpposition) {
      // Separamos los IDs válidos del valor null para evitar errores de validación en Prisma
      const ids = Array.isArray(oppositionId) 
        ? oppositionId.filter(id => id !== null)
        : (oppositionId ? [oppositionId] : []);

      const orConditions = [
        { oppositionId: null } // Siempre incluimos temas generales
      ];

      if (ids.length > 0) {
        orConditions.push({ oppositionId: { in: ids } });
      }

      if (userId) {
        orConditions.push({ creatorId: userId }); // Temas creados por el propio usuario
      }

      where.OR = orConditions;
    }

    const topics = await prisma.topic.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        // Solo contamos preguntas activas para el total
        _count: {
          select: { questions: { where: { isActive: true } } },
        },
      },
    });

    if (userId) {
      // Cargar todo el progreso del usuario de una vez (evita N+1 queries)
      const progress = await prisma.userProgress.findMany({
        where: { userId },
        include: { question: { select: { topicId: true } } },
      });

      // Enriquecer cada tema con datos de progreso calculados en memoria
      return topics.map((topic) => {
        const topicProgress = progress.filter(
          (p) => p.question.topicId === topic.id
        );
        const totalQuestions = topic._count.questions;
        const answeredCorrectly = topicProgress.filter((p) => p.isCorrect).length;
        const mastered = topicProgress.filter((p) => p.isMastered).length;

        return {
          ...topic,
          totalQuestions,
          answeredCorrectly,
          mastered,
          // Porcentaje redondeado sobre preguntas respondidas correctamente
          progressPercent: totalQuestions > 0
            ? Math.round((answeredCorrectly / totalQuestions) * 100)
            : 0,
        };
      });
    }

    // Sin usuario: solo devolver el conteo total de preguntas
    return topics.map((topic) => ({
      ...topic,
      totalQuestions: topic._count.questions,
    }));
  }

  /**
   * Obtiene un tema específico con sus preguntas.
   *
   * NOTA DE SEGURIDAD: No se devuelve el campo `correctIndex` en las preguntas.
   * Esto evita que alguien inspeccione la red y vea las respuestas correctas
   * antes de responder. La respuesta correcta solo se devuelve en questionService.answerQuestion.
   *
   * @param {string}      id     - UUID del tema
   * @param {string|null} userId - UUID del usuario (actualmente no usado, para futuro)
   * @returns {object} Tema con sus preguntas (sin correctIndex)
   */
  async getById(id, userId = null) {
    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        subtopics: {
          orderBy: { order: 'asc' },
          include: {
             _count: {
               select: { questions: true },
             },
          }
        },
        questions: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            questionText: true,
            options: true,
            difficulty: true,
            subtopicId: true,
            // correctIndex NO se incluye aquí intencionalmente (anti-cheat)
          },
        },
        _count: {
          select: { questions: { where: { isActive: true } } },
        },
      },
    });

    if (!topic) {
      throw new AppError('Tema no encontrado', 404);
    }

    return topic;
  }

  /**
   * Crea un nuevo tema.
   *
   * La validación de campos viene del schema Zod (createTopicSchema).
   * El controler (topicController.create) adjunta automáticamente el creatorId.
   *
   * @param {object} data - Datos del nuevo tema (title es obligatorio)
   * @returns {object} Tema creado
   */
  async create(data) {
    return prisma.topic.create({ data });
  }

  /**
   * Actualiza un tema existente.
   *
   * Verifica la existencia antes de actualizar para dar un error 404 claro
   * en lugar de un error genérico de Prisma si el ID no existe.
   *
   * @param {string} id   - UUID del tema
   * @param {object} data - Campos a actualizar (todos opcionales)
   * @returns {object} Tema actualizado
   */
  async update(id, data) {
    const topic = await prisma.topic.findUnique({ where: { id } });
    if (!topic) throw new AppError('Tema no encontrado', 404);

    return prisma.topic.update({ where: { id }, data });
  }

  /**
   * Oculta un tema (soft delete — no borra los datos).
   *
   * En lugar de eliminar el tema de la BD (lo que borraría las preguntas y el
   * progreso de los usuarios), simplemente lo marca como inactivo (isActive = false).
   * Esto preserva el historial de progreso de todos los usuarios.
   *
   * Para eliminar permanentemente un tema, usar adminService.deleteTopic()
   * (que solo lo permite si no tiene preguntas asociadas).
   *
   * @param {string} id - UUID del tema a archivar
   * @returns {object} Tema con isActive = false
   */
  async delete(id) {
    const topic = await prisma.topic.findUnique({ where: { id } });
    if (!topic) throw new AppError('Tema no encontrado', 404);

    // Soft delete: marcar como inactivo, no borrar de la BD
    return prisma.topic.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

module.exports = new TopicService();
