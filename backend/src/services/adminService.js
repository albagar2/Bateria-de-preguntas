// ============================================
// Admin Service — Capa de lógica de negocio
// ============================================
// Este servicio contiene todas las operaciones privilegiadas que solo
// puede ejecutar un usuario con role = 'ADMIN'.
//
// ARQUITECTURA:
//   AdminController → AdminService (este archivo) → Prisma → Base de Datos
//
// AUTORIZACIÓN:
//   La restricción de acceso ('ADMIN') se aplica en las rutas (routes/index.js)
//   mediante el middleware: authorize('ADMIN')
//   Este servicio NO comprueba roles; asume que el controlador ya lo hizo.
//
// PARA AÑADIR UNA NUEVA OPERACIÓN DE ADMIN:
//   1. Añade el método aquí en AdminService
//   2. Crea el handler en adminController.js
//   3. Registra la ruta en routes/index.js con authorize('ADMIN')
// ============================================

const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

class AdminService {

  // ─────────────────────────────────────────
  // GESTIÓN DE USUARIOS
  // ─────────────────────────────────────────

  /**
   * Obtiene todos los usuarios del sistema con su información básica.
   *
   * Retorna: lista de usuarios ordenados por fecha de creación (más recientes primero).
   * Incluye:
   *   - Datos básicos (id, nombre, email, rol, fecha de registro)
   *   - Las oposiciones en las que está inscrito (relación many-to-many)
   *   - Contadores de tests realizados y errores guardados
   *
   * NOTA: No devuelve passwordHash por seguridad.
   * Si necesitas añadir más datos al listado (ej: examDate), añádelos en el select.
   */
  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // Relación muchos-a-muchos: oposiciones en las que está inscrito el usuario
        oppositions: {
          select: { name: true }
        },
        // Contadores calculados por Prisma sin cargar los registros completos
        _count: {
          select: { tests: true, mistakes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Elimina un usuario por su ID.
   *
   * Protecciones:
   *   - No permite eliminar a otro ADMIN (protección contra borrado accidental)
   *   - Prisma elimina en cascada todos los datos relacionados del usuario
   *     (tests, errores, progreso, planes de estudio, etc.) según el schema.
   *
   * Para cambiar qué datos se borran en cascada: edita schema.prisma y
   * añade/quita `onDelete: Cascade` en las relaciones correspondientes.
   *
   * @param {string} userId - UUID del usuario a eliminar
   */
  async deleteUser(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('Usuario no encontrado', 404);

    // Salvaguarda: no se puede eliminar a otro administrador
    if (user.role === 'ADMIN') {
      throw new AppError('No se puede eliminar a otro administrador', 403);
    }

    // El onDelete: Cascade del schema borra automáticamente los datos relacionados
    await prisma.user.delete({ where: { id: userId } });
    return { message: 'Usuario eliminado correctamente' };
  }

  /**
   * Actualiza el rol de un usuario (USER ↔ ADMIN).
   *
   * Valores válidos del enum Role: 'USER', 'ADMIN'
   * Si se añaden nuevos roles en schema.prisma, actualizar también el
   * enum Role en el schema y regenerar el cliente: `npx prisma generate`
   *
   * @param {string} userId - UUID del usuario
   * @param {string} role   - Nuevo rol ('USER' o 'ADMIN')
   */
  async updateUserRole(userId, role) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, role: true }
    });
  }

  // ─────────────────────────────────────────
  // ESTADÍSTICAS GLOBALES DEL SISTEMA
  // ─────────────────────────────────────────

  /**
   * Obtiene métricas globales del sistema para el panel de administración.
   *
   * Ejecuta 4 consultas COUNT en paralelo (Promise.all) para minimizar
   * el tiempo de respuesta.
   *
   * Para añadir más métricas (ej: número de oposiciones activas):
   *   1. Añade la consulta al array de Promise.all
   *   2. Desestructura el resultado y añádelo al objeto retornado
   */
  async getSystemStats() {
    const [userCount, questionCount, testCount, topicCount] = await Promise.all([
      prisma.user.count(),
      prisma.question.count(),
      prisma.test.count(),
      prisma.topic.count()
    ]);

    return {
      users: userCount,
      questions: questionCount,
      tests: testCount,
      topics: topicCount
    };
  }

  // ─────────────────────────────────────────
  // GESTIÓN DE TEMAS (CRUD)
  // ─────────────────────────────────────────

  /**
   * Crea un nuevo tema en la base de datos.
   *
   * Campos esperados en `data`:
   *   - title (obligatorio): nombre del tema
   *   - description (opcional): descripción larga
   *   - icon (opcional): emoji o carácter para el icono visual
   *   - color (opcional): color en formato hex (#RRGGBB)
   *   - order (opcional): posición en el listado (default: 0)
   *   - oppositionId (opcional): vincula el tema a una oposición concreta
   *
   * La validación de los campos viene del schema Zod en validators/schemas.js
   *
   * @param {object} data - Datos del nuevo tema
   */
  async createTopic(data) {
    return prisma.topic.create({ data });
  }

  /**
   * Actualiza los campos editables de un tema existente.
   *
   * IMPORTANTE: Solo actualizamos campos específicos (lista blanca) para evitar
   * que el cliente pueda modificar campos internos como 'createdAt', 'creatorId'
   * o relaciones que no deben cambiar desde aquí.
   *
   * Campos que SÍ se pueden editar desde el panel admin:
   *   - title, description, icon, color, order
   *
   * Para permitir editar más campos (ej: isActive para archivar un tema),
   * añádelos a la desestructuración de `data` y al objeto `data` del update.
   *
   * @param {string} id   - UUID del tema a actualizar
   * @param {object} data - Objeto con los nuevos valores
   */
  async updateTopic(id, data) {
    const { title, description, icon, color, order, oppositionId } = data;
    return prisma.topic.update({
      where: { id },
      data: { title, description, icon, color, order, oppositionId }
    });
  }

  /**
   * Elimina un tema de la base de datos.
   *
   * Protección: No permite eliminar un tema que tenga preguntas asociadas.
   * Esto evita pérdida accidental de datos. Si quieres forzar la eliminación
   * con todas sus preguntas, elimina primero las preguntas o cambia a
   * onDelete: Cascade en la relación Topic→Question del schema.prisma.
   *
   * @param {string} id - UUID del tema a eliminar
   */
  async deleteTopic(id) {
    const questionsCount = await prisma.question.count({ where: { topicId: id } });
    if (questionsCount > 0) {
      throw new AppError(
        `No se puede eliminar: el tema tiene ${questionsCount} pregunta(s) asociada(s)`,
        400
      );
    }
    return prisma.topic.delete({ where: { id } });
  }

  // ─────────────────────────────────────────
  // GESTIÓN DE PREGUNTAS (CRUD)
  // ─────────────────────────────────────────

  /**
   * Obtiene todas las preguntas del sistema (máximo 100 para evitar sobrecarga).
   *
   * Si necesitas paginar o filtrar por oposición/tema, añade parámetros
   * a este método y usa `where`, `skip` y `take` de Prisma.
   *
   * Incluye el título del tema al que pertenece cada pregunta para
   * mostrar contexto en el listado del panel de admin.
   */
  async getAllQuestions() {
    return prisma.question.findMany({
      include: {
        topic: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  /**
   * Crea una nueva pregunta en la base de datos.
   *
   * Campos esperados en `data`:
   *   - topicId (obligatorio): UUID del tema al que pertenece
   *   - questionText (obligatorio): enunciado de la pregunta
   *   - options (obligatorio): array de strings con las opciones (mínimo 2)
   *   - correctIndex (obligatorio): índice (0-based) de la opción correcta
   *   - explanation (opcional): texto explicativo de la respuesta
   *   - difficulty (opcional): 'EASY' | 'MEDIUM' | 'HARD' (default: 'MEDIUM')
   *
   * Las opciones se almacenan como JSON en la BD (campo `options Json` en schema).
   *
   * @param {object} data - Datos de la nueva pregunta
   */
  async createQuestion(data) {
    return prisma.question.create({ data });
  }

  /**
   * Actualiza los campos editables de una pregunta existente.
   *
   * Lista blanca de campos actualizables (evita modificar topicId, createdAt, etc.):
   *   - questionText, options, correctIndex, explanation, difficulty
   *
   * Para mover una pregunta de tema (cambiar topicId), añade 'topicId'
   * a la desestructuración y al objeto data del update.
   *
   * @param {string} id   - UUID de la pregunta a actualizar
   * @param {object} data - Nuevos valores para los campos editables
   */
  async updateQuestion(id, data) {
    const { questionText, options, correctIndex, explanation, difficulty, topicId, subtopicId } = data;
    return prisma.question.update({
      where: { id },
      data: { questionText, options, correctIndex, explanation, difficulty, topicId, subtopicId }
    });
  }

  /**
   * Elimina una pregunta por su ID.
   *
   * El schema tiene onDelete: Cascade en las relaciones de Question con:
   *   - UserProgress (progreso del usuario en esa pregunta)
   *   - Mistake (errores registrados)
   *   - TestAnswer (respuestas en tests)
   *   - Bookmark (marcadores)
   * Todos estos registros se borran automáticamente al eliminar la pregunta.
   *
   * @param {string} id - UUID de la pregunta a eliminar
   */
  async deleteQuestion(id) {
    return prisma.question.delete({ where: { id } });
  }
}

module.exports = new AdminService();
