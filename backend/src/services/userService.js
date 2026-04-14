// ============================================
// User Service — Capa de lógica de negocio
// ============================================
// Gestiona las operaciones sobre el perfil del usuario autenticado:
//   - Consultar su perfil con oposiciones
//   - Actualizar datos personales y preferencias
//   - Cambiar contraseña (con verificación de la actual)
//   - Eliminar cuenta con todos sus datos
//
// DIFERENCIA CON adminService:
//   Este servicio opera siempre sobre el usuario logueado (req.user.id).
//   adminService opera sobre cualquier usuario por su ID (solo para ADMINs).
// ============================================

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

// Debe coincidir con el SALT_ROUNDS de authService para consistencia
const SALT_ROUNDS = 12;

class UserService {

  /**
   * Obtiene el perfil completo del usuario.
   *
   * Devuelve más campos que el auth middleware (getProfile incluye darkMode,
   * notifications, examDate) porque es la vista de perfil, no solo identificación.
   *
   * Si necesitas añadir nuevos campos de usuario a la vista de perfil,
   * agrégalos en el `select` de esta consulta.
   *
   * La relación `oppositions` devuelve las oposiciones inscritas con
   * id, name e icon para mostrarlas en la UI del perfil.
   *
   * @param {string} userId - UUID del usuario autenticado
   * @returns {object} Datos del perfil del usuario
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        // Oposiciones inscritas (relación many-to-many definida en schema.prisma)
        oppositions: { select: { id: true, name: true, icon: true } },
        examDate: true,
        darkMode: true,
        notifications: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError('Usuario no encontrado', 404);
    return user;
  }

  /**
   * Actualiza los datos del perfil del usuario.
   *
   * Manejo especial del campo `oppositionId`:
   *   - El frontend puede enviar un string (un ID) o un array (varios IDs).
   *   - Si se envía un array vacío [], se desconectan TODAS las oposiciones.
   *   - Si NO se envía `oppositionId`, las oposiciones NO cambian.
   *   - Usamos Prisma `set` (no `connect`) para REEMPLAZAR las oposiciones completas.
   *     `set: []` desconecta todo; `set: [{id}, {id}]` reemplaza la lista.
   *
   * Para añadir oposiciones sin reemplazar (connect) en lugar de set,
   * cambia `set` por `connect` en la línea del updateData.oppositions.
   *
   * Campos actualizables:
   *   - name, examDate, darkMode, notifications (via otherData)
   *   - oppositions (via lógica especial)
   *
   * @param {string} userId - UUID del usuario
   * @param {object} data   - Campos a actualizar (parciales, todos opcionales)
   * @returns {object} Perfil actualizado
   */
  async updateProfile(userId, data) {
    // Separar oppositionId del resto para tratarlo de forma especial
    const { oppositionId, ...otherData } = data;
    const updateData = { ...otherData };

    if (oppositionId !== undefined) {
      // Normalizar: siempre trabajamos con un array de IDs
      const oppArray = Array.isArray(oppositionId)
        ? oppositionId
        : (oppositionId ? [oppositionId] : []);

      // `set` reemplaza completamente la lista de oposiciones inscritas
      updateData.oppositions = {
        set: oppArray.map(id => ({ id }))
      };
    }

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        oppositions: { select: { id: true, name: true, icon: true } },
        examDate: true,
        darkMode: true,
        notifications: true,
      },
    });
  }

  /**
   * Cambia la contraseña del usuario.
   *
   * Proceso de seguridad en dos pasos:
   *   1. Verifica que la contraseña ACTUAL es correcta
   *   2. Si lo es, genera el hash de la nueva y actualiza la BD
   *   3. Invalida TODAS las sesiones activas → fuerza re-login en todos los dispositivos
   *      Esto es una práctica de seguridad estándar ante cambio de contraseña.
   *
   * La validación de complejidad de la nueva contraseña se hace en el validator
   * Zod (validators/schemas.js → changePasswordSchema) antes de llegar aquí.
   *
   * @param {string} userId          - UUID del usuario
   * @param {object} passwords       - { currentPassword, newPassword }
   * @returns {{ message: string }}
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    // Solo cargamos el hash — no más datos del usuario para minimizar exposición
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) throw new AppError('Usuario no encontrado', 404);

    // Verificar que la contraseña actual coincide con el hash almacenado
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AppError('Contraseña actual incorrecta', 401);
    }

    // Hashear la nueva contraseña
    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Invalidar todas las sesiones → el usuario deberá hacer login de nuevo
    await prisma.session.deleteMany({ where: { userId } });

    return { message: 'Contraseña actualizada correctamente' };
  }

  /**
   * Elimina la cuenta del usuario y todos sus datos.
   *
   * Requiere confirmación con contraseña para evitar eliminaciones accidentales.
   *
   * El delete en cascada de Prisma (onDelete: Cascade en schema.prisma) elimina
   * automáticamente todos los datos relacionados:
   *   - Tests, TestAnswers, UserProgress, Mistakes
   *   - StudyPlans, Streak, Bookmarks, Achievements, Sessions
   *
   * AVISO: Esta acción es IRREVERSIBLE. No hay soft-delete implementado.
   *         Si se quiere implementar soft-delete, cambiar el delete por
   *         un update con { isDeleted: true } (requiere campo en schema).
   *
   * @param {string} userId   - UUID del usuario
   * @param {string} password - Contraseña actual para confirmar
   * @returns {{ message: string }}
   */
  async deleteAccount(userId, password) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) throw new AppError('Usuario no encontrado', 404);

    // Doble confirmación: verificar contraseña antes de destruir la cuenta
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Contraseña incorrecta', 401);
    }

    // El cascade del schema borra todos los datos relacionados automáticamente
    await prisma.user.delete({ where: { id: userId } });

    return { message: 'Cuenta eliminada correctamente' };
  }
}

module.exports = new UserService();
