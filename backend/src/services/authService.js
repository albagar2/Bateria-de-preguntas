// ============================================
// Auth Service — Capa de lógica de negocio
// ============================================
// Gestiona el ciclo completo de autenticación:
//   - Registro de nuevos usuarios
//   - Inicio de sesión y generación de tokens
//   - Renovación del access token mediante refresh token
//   - Cierre de sesión (individual o total)
//
// SISTEMA DE TOKENS (doble token):
//   - Access Token:   JWT de corta vida (configurable en .env: JWT_EXPIRES_IN)
//                     Se envía con cada petición en el header Authorization.
//   - Refresh Token:  JWT de larga vida (JWT_REFRESH_EXPIRES_IN, por defecto 7 días).
//                     Se almacena en la tabla `sessions` de la BD.
//                     Permite obtener un nuevo access token sin re-login.
//
// SEGURIDAD:
//   - Las contraseñas se hashean con bcrypt (SALT_ROUNDS = 12).
//     Aumentar SALT_ROUNDS incrementa la seguridad pero también el tiempo de CPU.
//   - Los mensajes de error del login son genéricos para no revelar si el email existe.
//   - Se mantienen máximo 5 sesiones activas por usuario (limpieza automática).
// ============================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { env } = require('../config/env');
const { AppError } = require('../utils/AppError');
const { logger } = require('../config/logger');

// Número de rondas de salt para bcrypt. Valor recomendado: 12.
// Aumentar a 14+ para producción con alta seguridad, aunque tardará más en el login.
const SALT_ROUNDS = 12;

class AuthService {

  /**
   * Registra un nuevo usuario en el sistema.
   *
   * Proceso:
   *   1. Verifica que el email no esté ya en uso
   *   2. Hashea la contraseña con bcrypt
   *   3. Crea el usuario y su registro de racha (Streak) en una transacción atómica
   *      → Si cualquier parte falla, se revierte todo (consistencia de datos)
   *   4. Genera los tokens JWT de acceso y refresco
   *
   * El parámetro `oppositionId` puede ser:
   *   - Un UUID string → se conecta esa única oposición
   *   - null/undefined → el usuario se registra sin oposición (la elige después en perfil)
   *
   * Para soportar registro con múltiples oposiciones desde el inicio,
   * cambia el parámetro a `oppositionIds` (array) y usa { connect: ids.map(id => ({ id })) }
   *
   * @param {object} data - { name, email, password, oppositionId }
   * @returns {{ user, accessToken, refreshToken }}
   */
  async register({ name, email, password, oppositionId }) {
    // 1. Comprobar que el email no esté registrado
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Ya existe una cuenta con este email', 409);
    }

    // 2. Hashear contraseña (operación costosa por diseño — no eliminar el await)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Transacción: crear usuario + inicializar racha en un solo bloque atómico
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          // Conectar oposición si se proporcionó (relación many-to-many)
          oppositions: oppositionId ? { connect: [{ id: oppositionId }] } : undefined,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          oppositions: { select: { id: true, name: true } },
          createdAt: true,
        },
      });

      // Inicializar el registro de racha con valores en 0
      // El modelo Streak siempre debe existir para el usuario (requerido por statsService)
      await tx.streak.create({
        data: {
          userId: newUser.id,
          currentStreak: 0,
          maxStreak: 0,
          currentNoFail: 0,
          maxNoFail: 0,
        },
      });

      return newUser;
    });

    // 4. Generar y guardar tokens
    const tokens = await this._generateTokens(user);

    logger.info(`User registered: ${user.id}`);

    return { user, ...tokens };
  }

  /**
   * Autentica a un usuario existente (inicio de sesión).
   *
   * Proceso:
   *   1. Busca al usuario por email (incluyendo el hash de contraseña)
   *   2. Compara la contraseña proporcionada con el hash almacenado
   *   3. Genera los tokens JWT
   *   4. Devuelve el usuario SIN el hash de contraseña
   *
   * Los parámetros `userAgent` e `ipAddress` se guardan junto a la sesión
   * para auditoría (permiten saber desde qué dispositivo se inició sesión).
   *
   * IMPORTANTE: El error de "credenciales inválidas" es el mismo si el email
   * no existe que si la contraseña es incorrecta. Esto es intencional por seguridad.
   *
   * @param {object} credentials - { email, password }
   * @param {string} userAgent   - Header User-Agent del cliente (para auditoría)
   * @param {string} ipAddress   - IP del cliente (para auditoría)
   * @returns {{ user, accessToken, refreshToken }}
   */
  async login({ email, password }, userAgent, ipAddress) {
    // Buscar usuario incluyendo el hash para comparar (no se devuelve nunca al cliente)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        oppositions: { select: { id: true, name: true, icon: true } },
        passwordHash: true,
        createdAt: true,
      },
    });

    // Mensaje genérico para no revelar si el email existe (protección contra enumeración)
    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Comparar la contraseña del formulario con el hash de la BD
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Generar los tokens y guardar la sesión en la BD
    const tokens = await this._generateTokens(user, userAgent, ipAddress);

    // Eliminar el hash antes de devolver el usuario al cliente
    const { passwordHash: _, ...safeUser } = user;

    logger.info(`User logged in: ${user.id}`);

    return { user: safeUser, ...tokens };
  }

  /**
   * Renueva el access token usando un refresh token válido.
   *
   * El cliente llama a este endpoint cuando recibe un 401 con un access token caducado.
   * El flujo completo en el frontend está en api.js → tryRefreshToken().
   *
   * Verificaciones:
   *   - El refresh token tiene firma válida (JWT_REFRESH_SECRET)
   *   - El registro de sesión existe en la BD (no fue revocado manualmente)
   *   - La sesión no ha expirado según el campo `expiresAt`
   *
   * Solo regenera el access token; el refresh token sigue siendo el mismo.
   * Para implementar "refresh token rotation" (mayor seguridad), también habría
   * que invalidar el refresh token viejo y crear uno nuevo aquí.
   *
   * @param {string} refreshToken - El refresh token del cliente
   * @returns {{ accessToken, user }}
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Refresh token no proporcionado', 401);
    }

    // Verificar la firma del refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Refresh token inválido o expirado', 401);
    }

    // Verificar que la sesión existe en BD y no fue revocada
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, role: true,
            oppositions: { select: { id: true, name: true } }
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      // Limpiar sesión expirada si existe
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      throw new AppError('Sesión expirada. Inicia sesión de nuevo', 401);
    }

    // Generar nuevo access token (mismo usuario, nueva firma)
    const accessToken = this._signAccessToken(session.user);

    return { accessToken, user: session.user };
  }

  /**
   * Cierra la sesión actual invalidando el refresh token.
   *
   * Al eliminar la sesión de la BD, el refresh token queda inutilizable
   * aunque su firma JWT siga siendo válida hasta que expire.
   * Esto permite revocar sesiones instantáneamente sin esperar a que el JWT caduque.
   *
   * No lanza error si el token no existe (puede que ya estuviera cerrado).
   *
   * @param {string} refreshToken - El refresh token a invalidar
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await prisma.session.deleteMany({
        where: { refreshToken },
      }).catch(() => {
        // Sesión ya no existe — no es un error, ignoramos
      });
    }
  }

  /**
   * Cierra TODAS las sesiones del usuario en todos sus dispositivos.
   *
   * Útil cuando el usuario cambia su contraseña o sospecha de acceso no autorizado.
   * Tras llamar a esto, el usuario deberá iniciar sesión de nuevo en todos sus dispositivos.
   *
   * @param {string} userId - UUID del usuario
   */
  async logoutAll(userId) {
    await prisma.session.deleteMany({
      where: { userId },
    });
    logger.info(`All sessions revoked for user: ${userId}`);
  }

  // ─── Métodos Privados ───────────────────────
  // Convención: métodos con _ al inicio = solo uso interno de la clase

  /**
   * Firma y genera el JWT de acceso (corta duración).
   *
   * El payload del token contiene: userId y role.
   * Solo incluye lo mínimo necesario — no incluyas datos sensibles en el JWT
   * porque el payload es solo Base64, no está cifrado (aunque sí firmado).
   *
   * La duración viene de JWT_EXPIRES_IN en .env (ej: "8h", "15m", "1d")
   *
   * @param {object} user - Debe tener { id, role }
   * @returns {string} JWT firmado
   */
  _signAccessToken(user) {
    return jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  /**
   * Genera el par de tokens (access + refresh) y persiste la sesión en BD.
   *
   * También limpia sesiones antiguas del usuario si supera el límite de 5.
   * Este límite evita acumulación indefinida de tokens en la BD.
   * Para cambiarlo: busca `sessions.length > 5` abajo.
   *
   * La fecha de expiración del refresh token en BD se calcula como +7 días.
   * Si cambias JWT_REFRESH_EXPIRES_IN en .env, actualiza también el cálculo de expiresAt.
   *
   * @param {object} user       - Datos del usuario
   * @param {string} userAgent  - Para auditoría (puede ser null)
   * @param {string} ipAddress  - Para auditoría (puede ser null)
   * @returns {{ accessToken, refreshToken }}
   */
  async _generateTokens(user, userAgent = null, ipAddress = null) {
    const accessToken = this._signAccessToken(user);

    const refreshToken = jwt.sign(
      { userId: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    // Calcular fecha de expiración para guardar en BD
    // Debe coincidir con JWT_REFRESH_EXPIRES_IN (actualmente 7 días)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Persistir la sesión en la BD para poder revocarla si es necesario
    await prisma.session.create({
      data: { userId: user.id, refreshToken, userAgent, ipAddress, expiresAt },
    });

    // Limitar a 5 sesiones activas por usuario (elimina las más antiguas)
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (sessions.length > 5) {
      const toDelete = sessions.slice(5).map((s) => s.id);
      await prisma.session.deleteMany({ where: { id: { in: toDelete } } });
    }

    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();
