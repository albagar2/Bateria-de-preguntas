// ============================================
// Opposition Service — Capa de lógica de negocio
// ============================================
// Gestiona las oposiciones (convocatorias de exámenes públicos).
//
// MODELO DE DATOS:
//   Opposition tiene relación many-to-many con User (EnrolledOppositions).
//   Opposition tiene relación one-to-many con Topic.
//   Una Opposition puede ser creada por un admin o por un usuario (campo creatorId).
//
// FLUJO TÍPICO:
//   1. Admin (o usuario) crea una oposición con nombre e icono
//   2. Se vinculan temas a esa oposición (oppositionId en Topic)
//   3. Usuarios se inscriben en la oposición desde su perfil
//
// PARA AÑADIR MÁS OPERACIONES (ej: actualizar, eliminar oposición):
//   1. Añade el método aquí
//   2. Crea el handler en oppositionController.js
//   3. Registra la ruta en routes/index.js con el middleware apropiado
// ============================================

const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

class OppositionService {

  /**
   * Obtiene todas las oposiciones disponibles en el sistema.
   *
   * Esta ruta es pública (no requiere autenticación) para que los usuarios
   * puedan ver las oposiciones disponibles al registrarse o editar su perfil.
   *
   * Ordenadas alfabéticamente por nombre para facilitar la búsqueda.
   *
   * Para añadir filtros (ej: solo activas, por región), añade un parámetro
   * `filters` y construye el objeto `where` dinámicamente.
   *
   * @returns {Array} Lista de todas las oposiciones
   */
  async getAll() {
    return prisma.opposition.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Obtiene una oposición por su ID con sus temas asociados.
   *
   * @param {string} id - UUID de la oposición
   * @returns {object} Oposición encontrada
   * @throws {AppError} 404 si no existe
   */
  async getById(id) {
    const opp = await prisma.opposition.findUnique({
      where: { id },
    });
    if (!opp) throw new AppError('Oposición no encontrada', 404);
    return opp;
  }

  /**
   * Crea una nueva oposición.
   *
   * Puede ser creada por un admin (desde el panel) o por un usuario que no
   * encuentra su oposición en el listado (desde el perfil o dashboard).
   *
   * El campo `creatorId` se adjunta automáticamente en el controlador
   * desde req.user.id si el usuario está autenticado.
   *
   * Campos esperados en `data`:
   *   - name (obligatorio): nombre de la oposición (ej: "Guardia Civil 2025")
   *   - description (opcional): descripción larga
   *   - icon (opcional): emoji o carácter visual
   *   - creatorId (opcional): UUID del usuario que la creó
   *
   * @param {object} data - Datos de la nueva oposición
   * @returns {object} Oposición creada
   */
  async create(data) {
    return prisma.opposition.create({ data });
  }
}

module.exports = new OppositionService();
