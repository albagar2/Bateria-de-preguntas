// ============================================
// Study Plan Service — Capa de lógica de negocio
// ============================================
// Genera y gestiona planes de estudio personalizados.
//
// LÓGICA DE GENERACIÓN (generate):
//   El algoritmo distribuye los temas entre los días hasta el examen,
//   priorizando los temas donde el usuario tiene menos progreso.
//
//   Estrategia de distribución:
//     1. Calcula la prioridad de cada tema (1 - porcentaje_correcto)
//        → Los temas con menos aciertos tienen mayor prioridad
//     2. Ordena los temas de mayor a menor prioridad
//     3. Distribuye los temas rotando por los días del ciclo
//     4. Los últimos 3 días antes del examen son siempre "Repaso General"
//        con TODOS los temas
//
//   Para cambiar la estrategia de distribución: modificar el bucle
//   `for (let day = 0; day < daysUntilExam; day++)` y la lógica de dayTopics.
//
// LÍMITES:
//   - La fecha de examen debe ser futura
//   - Genera un plan por día (1 registro StudyPlan por fecha)
//   - Elimina los planes futuros no completados antes de generar nuevos
//     (evita duplicados si el usuario regenera el plan)
// ============================================

const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

class StudyPlanService {

  /**
   * Genera automáticamente un plan de estudio desde hoy hasta la fecha de examen.
   *
   * @param {string} userId  - UUID del usuario
   * @param {object} params  - { examDate: string (ISO), topicIds: string[] }
   * @returns {{
   *   totalDays: number,   // Días totales hasta el examen
   *   plansCreated: number, // Número de planes creados
   *   plans: Array         // Primeros 14 días del plan (2 semanas para mostrar en UI)
   * }}
   */
  async generate(userId, { examDate, topicIds }) {
    // Normalizar fechas a medianoche para comparar solo por fecha (sin hora)
    const exam = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exam.setHours(0, 0, 0, 0);

    if (exam <= today) {
      throw new AppError('La fecha de examen debe ser futura', 400);
    }

    const daysUntilExam = Math.floor((exam - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExam < 1) {
      throw new AppError('Necesitas al menos 1 día para el plan de estudio', 400);
    }

    // Cargar los temas seleccionados con su conteo de preguntas activas
    const topics = await prisma.topic.findMany({
      where: { id: { in: topicIds }, isActive: true },
      include: {
        _count: { select: { questions: { where: { isActive: true } } } },
      },
      orderBy: { order: 'asc' },
    });

    if (topics.length === 0) {
      throw new AppError('No se encontraron los temas seleccionados', 404);
    }

    // Cargar el progreso del usuario en los temas seleccionados (1 query para todos)
    const progress = await prisma.userProgress.findMany({
      where: { userId, question: { topicId: { in: topicIds } } },
      include: { question: { select: { topicId: true } } },
    });

    // Calcular prioridad: temas con menos % correcto tienen más prioridad
    // topicPriority queda ordenado de mayor a menor prioridad
    const topicPriority = topics.map((topic) => {
      const topicProgress = progress.filter(
        (p) => p.question.topicId === topic.id
      );
      const correct = topicProgress.filter((p) => p.isCorrect).length;
      const total = topic._count.questions;
      const progressPercent = total > 0 ? correct / total : 0;

      return {
        topicId: topic.id,
        title: topic.title,
        progressPercent,
        priority: 1 - progressPercent, // 0 progreso = prioridad máxima (1)
      };
    }).sort((a, b) => b.priority - a.priority);

    // Eliminar planes futuros no completados para evitar duplicados al regenerar
    await prisma.studyPlan.deleteMany({
      where: {
        userId,
        date: { gte: today },
        isCompleted: false,
      },
    });

    // Calcular cuántos temas estudiar por día
    // Máximo: todos los temas si los días son suficientes, mínimo 1
    const topicsPerDay = Math.max(
      1,
      Math.ceil(topicPriority.length / Math.min(daysUntilExam, 7))
    );

    const plans = [];

    for (let day = 0; day < daysUntilExam; day++) {
      const planDate = new Date(today);
      planDate.setDate(planDate.getDate() + day);

      // Últimos 3 días antes del examen → repaso general de todos los temas
      if (daysUntilExam - day <= 3) {
        const allTopicIds = topicPriority.map((t) => t.topicId);
        plans.push({
          userId,
          date: planDate,
          topicIds: allTopicIds,
          description: `📝 Repaso general intensivo — ${daysUntilExam - day} día(s) para el examen`,
        });
      } else {
        // Días normales: rotar temas según prioridad usando módulo
        // day * topicsPerDay + t garantiza una rotación progresiva de temas
        const dayTopics = [];
        for (let t = 0; t < topicsPerDay; t++) {
          const topicIndex = (day * topicsPerDay + t) % topicPriority.length;
          dayTopics.push(topicPriority[topicIndex].topicId);
        }

        const descriptions = dayTopics.map((id) =>
          topicPriority.find((t) => t.topicId === id)?.title
        );
        plans.push({
          userId,
          date: planDate,
          topicIds: dayTopics,
          description: `📚 Estudiar: ${descriptions.join(', ')}`,
        });
      }
    }

    // Insertar todos los planes de una vez (más eficiente que uno a uno)
    await prisma.studyPlan.createMany({ data: plans });

    // Guardar la fecha de examen en el perfil del usuario para mostrarse en el dashboard
    await prisma.user.update({
      where: { id: userId },
      data: { examDate: exam },
    });

    return {
      totalDays: daysUntilExam,
      plansCreated: plans.length,
      // Solo devolvemos las primeras 2 semanas para la respuesta (el resto está en BD)
      plans: plans.slice(0, 14),
    };
  }

  /**
   * Obtiene los planes de estudio del usuario en un rango de fechas opcional.
   *
   * Si no se pasan fechas, devuelve TODOS los planes del usuario.
   * Para obtener solo los de la semana actual, el cliente puede enviar:
   *   startDate = lunes de esta semana, endDate = domingo de esta semana.
   *
   * @param {string} userId  - UUID del usuario
   * @param {object} params  - { startDate?: string, endDate?: string } (ISO)
   * @returns {Array} Planes ordenados por fecha ascendente
   */
  async getPlans(userId, { startDate, endDate } = {}) {
    const where = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return prisma.studyPlan.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Obtiene el plan de estudio de hoy para el usuario.
   *
   * Incluye los detalles de los temas (id, title, icon, color) para
   * mostrarlos directamente en la UI del Planner sin peticiones adicionales.
   *
   * Devuelve null si no hay plan para hoy (el usuario puede no haberlo generado
   * o ya lo tienen todo estudiado).
   *
   * @param {string} userId - UUID del usuario
   * @returns {object|null} Plan de hoy con temas enriquecidos, o null
   */
  async getTodayPlan(userId) {
    // Calcular el rango "hoy" (desde medianoche hasta medianoche del día siguiente)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const plan = await prisma.studyPlan.findFirst({
      where: {
        userId,
        date: { gte: today, lt: tomorrow },
      },
    });

    if (!plan) return null;

    // Cargar los detalles de los temas del plan para enriquecer la respuesta
    // topicIds en StudyPlan es un campo Json (array de UUIDs)
    const topics = await prisma.topic.findMany({
      where: { id: { in: plan.topicIds } },
      select: { id: true, title: true, icon: true, color: true },
    });

    return { ...plan, topics };
  }

  /**
   * Marca un plan de estudio como completado.
   *
   * Verifica que el plan pertenezca al usuario antes de actualizar
   * (protección contra modificaciones de planes ajenos).
   *
   * @param {string} userId - UUID del usuario (comprobación de propiedad)
   * @param {string} planId - UUID del plan a completar
   * @returns {object} Plan actualizado con isCompleted = true
   */
  async completePlan(userId, planId) {
    // Verificar que el plan existe Y pertenece a este usuario
    const plan = await prisma.studyPlan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) throw new AppError('Plan no encontrado', 404);

    return prisma.studyPlan.update({
      where: { id: planId },
      data: { isCompleted: !plan.isCompleted },
    });
  }
  /**
   * Obtiene consejos estratégicos de la IA para el plan de estudio actual.
   * 
   * Envía al microservicio de IA el resumen del plan (próximos temas)
   * y el progreso del usuario para que genere una recomendación personalizada.
   */
  async getAIAdvice(userId) {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:4001/api/v1';

    // Obtener los planes de la próxima semana
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [plans, stats] = await Promise.all([
      prisma.studyPlan.findMany({
        where: { userId, date: { gte: today, lt: nextWeek } },
        orderBy: { date: 'asc' }
      }),
      prisma.userProgress.findMany({
        where: { userId },
        include: { question: { select: { topicId: true } } }
      })
    ]);

    if (plans.length === 0) {
      return { advice: "Aún no has generado un plan de estudio. Ve a la sección del Planificador para empezar." };
    }

    // Simplificar datos para la IA
    const planSummary = plans.map(p => ({
      fecha: p.date.toLocaleDateString('es-ES'),
      tarea: p.description
    }));

    try {
      const response = await fetch(`${aiServiceUrl}/study-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planSummary,
          user_progress: stats.length, // Un resumen simple por ahora
          days_to_exam: plans.length > 0 ? 30 : 0 // Dato ficticio o real si lo tenemos
        })
      });

      if (!response.ok) throw new Error('Error al conectar con la IA');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error IA Planner:', error);
      return { advice: "La IA está descansando en este momento, pero tu plan sigue vigente: ¡Céntrate en los temas marcados para hoy!" };
    }
  }
}

module.exports = new StudyPlanService();
