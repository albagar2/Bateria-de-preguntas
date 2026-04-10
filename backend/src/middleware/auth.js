// ============================================
// JWT Authentication Middleware
// ============================================
// Este middleware protege las rutas de la API verificando que el usuario
// esté autenticado mediante un token JWT (JSON Web Token).
//
// FLUJO DE AUTENTICACIÓN:
//   1. El cliente envía el token en el header: "Authorization: Bearer <token>"
//   2. Este middleware lo extrae, lo verifica contra JWT_SECRET (.env)
//   3. Si es válido, busca al usuario en la BD (para asegurarse de que aún existe)
//   4. Adjunta el usuario a req.user para que los controladores lo usen
//
// TOKENS:
//   - Access Token: Corta duración (ej: 8h en dev, 15m en producción). 
//     Si expira, el cliente debe usar el Refresh Token para obtener uno nuevo.
//   - Refresh Token: Larga duración (7 días). 
//     Gestionado en authController.refreshToken
//
// PARA CAMBIAR LA DURACIÓN DE LOS TOKENS: Edita JWT_EXPIRES_IN en /backend/.env
// PARA CAMBIAR EL SECRETO: Edita JWT_SECRET en /backend/.env (requiere logout global)
// ============================================

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { prisma } = require('../config/database');
const { AppError } = require('../utils/AppError');

/**
 * Middleware de autenticación obligatoria.
 *
 * Úsalo en rutas que REQUIEREN usuario logueado.
 * Ejemplo de uso en rutas: router.get('/ruta', authenticate, controller.metodo)
 *
 * Qué hace:
 *   - Lee el token del header Authorization
 *   - Lo verifica con jsonwebtoken
 *   - Comprueba que el usuario sigue existiendo en la BD
 *   - Si todo va bien, adjunta el usuario a req.user y llama a next()
 *
 * Qué seleccionamos del usuario (req.user):
 *   - id, email, name, role: datos básicos de identificación
 *   - oppositions: las oposiciones en las que está inscrito (many-to-many)
 *     IMPORTANTE: Si añades un nuevo campo del usuario que necesites en los
 *     controladores, debes añadirlo también aquí en el select.
 *
 * Errores que puede lanzar:
 *   - 401 "Token no proporcionado"       → sin header Authorization
 *   - 401 "Token expirado"               → el access token caducó (cliente debe refrescar)
 *   - 401 "Token inválido"               → firma incorrecta o token corrupto
 *   - 401 "Usuario no encontrado"        → el usuario fue eliminado de la BD
 */
const authenticate = async (req, _res, next) => {
  try {
    // 1. Extraer el token del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token de autenticación no proporcionado', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Token de autenticación inválido', 401);
    }

    // 2. Verificar y decodificar el token
    //    jwt.verify lanza una excepción si el token es inválido o ha expirado
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token expirado. Por favor, inicia sesión de nuevo', 401);
      }
      throw new AppError('Token inválido', 401);
    }

    // 3. Buscar al usuario en la BD usando el ID que viene en el payload del token
    //    Seleccionamos solo los campos necesarios para minimizar datos en memoria.
    //    NOTA: La relación 'oppositions' usa el nombre muchos-a-muchos definido
    //    en schema.prisma como @relation("EnrolledOppositions").
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        oppositions: {
          select: { id: true, name: true }
        }
      },
    });

    // 4. Si el usuario fue eliminado después de emitir el token, rechazamos
    if (!user) {
      throw new AppError('Usuario no encontrado', 401);
    }

    // 5. Adjuntar el usuario al request para que los controladores lo usen
    req.user = user;
    next();

  } catch (error) {
    next(error);
  }
};

/**
 * Middleware de autenticación OPCIONAL.
 *
 * Úsalo en rutas que funcionan tanto para usuarios logueados como anónimos
 * pero que dan más información cuando el usuario está autenticado.
 * Ejemplo: listado de oposiciones (cualquiera puede verlas, pero el usuario
 *          autenticado puede ver cuáles tiene inscritas).
 *
 * Si el token es válido → req.user contiene el usuario
 * Si no hay token o es inválido → req.user es undefined, la petición continúa
 *
 * NUNCA lanza errores 401, siempre llama a next() independientemente.
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Sin token: seguimos sin usuario adjunto
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          oppositions: {
            select: { id: true, name: true }
          }
        },
      });
      // Solo adjuntamos el usuario si existe en la BD
      if (user) req.user = user;
    } catch {
      // Token inválido o expirado en ruta opcional → ignoramos silenciosamente
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate, optionalAuth };
