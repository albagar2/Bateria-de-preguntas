# 🎯 Batería de Preguntas — Plataforma de Estudio para Oposiciones

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)

Plataforma web completa para estudiantes de oposiciones con **modo sin fallos**, **tests acumulativos**, **repetición inteligente** (tipo Anki), **banco de errores**, **planificador automático** y **sistema de gamificación**.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Instalación Rápida](#-instalación-rápida)
- [Instalación con Docker](#-instalación-con-docker)
- [Instalación Manual](#-instalación-manual)
- [Seguridad](#-seguridad)
- [API Endpoints](#-api-endpoints)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Testing](#-testing)
- [Usuarios Demo](#-usuarios-demo)
- [Mejoras Futuras](#-mejoras-futuras)

---

## ✨ Características

### Core
- 🔁 **Modo sin fallos** — Si fallas, vuelves al inicio del bloque
- 📚 **Temas organizados** — Con dificultad (fácil/medio/difícil)
- 🧪 **Tests acumulativos** — Simulacros, rápidos, por tema, o de errores
- ❌ **Banco de errores** — Lista tus fallos y repítelos hasta dominarlos
- 📊 **Estadísticas detalladas** — % de aciertos, evolución, tiempo medio

### Inteligencia
- 🧠 **Repetición inteligente** — Algoritmo SM-2 (tipo Anki)
- 📅 **Planificador automático** — Introduce la fecha del examen y genera plan

### Gamificación
- 🔥 **Rachas diarias** — Días consecutivos estudiando
- ⚡ **Racha sin fallos** — Preguntas seguidas correctas
- 🏆 **17 logros** — Volumen, precisión, rachas, tests

### Multi-Oposición
- 📂 **Multi-categoría** — Los opositores pueden apuntarse y cambiar entre **varias oposiciones** de distintas categorías desde un mismo perfil.

### Novedad: AI Microservice Integrado
- 🤖 **Generación de Explicaciones** — Inteligencia Artificial (Gemini Pro/Flash) explica por qué fallaste, adaptado por nivel (básico, intermedio, avanzado).
- 🔄 **Alta Disponibilidad** — Arquitectura de Fallback multimodelo y Caché SQLite independiente para que la app no sufra caídas ni demoras.

### Seguridad
- 🔐 JWT (access + refresh tokens)
- 🔒 Contraseñas con **bcrypt** (12 rounds)
- 🛡️ OWASP Top 10 compliant
- ⚡ Rate limiting (general + auth)
- 🧹 Sanitización XSS + validación Zod
- 🎯 RBAC (Admin / User)

---

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + React Router v6 |
| Backend | Node.js + Express.js |
| Base de Datos | PostgreSQL 15 |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Validación | Zod |
| Seguridad | Helmet, CORS, Rate Limiting, HPP |
| Testing | Jest + Supertest |
| Deploy | Docker + Docker Compose |

---

## 🏗 Arquitectura

```
Clean Architecture
├── Domain       → Modelos Prisma (entidades)
├── Application  → Servicios (lógica de negocio)
├── Infrastructure → Base de datos, utilidades
└── Interface    → Controladores, rutas, middleware
```

---

## 🚀 Instalación Rápida

### Requisitos previos
- **Node.js** 18+ 
- **PostgreSQL** 15+ (o Docker)
- **npm** 9+

### 1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd bateriaDePreguntas
```

### 2. Configurar variables de entorno
```bash
cp .env.example backend/.env
# Editar backend/.env con tus valores
```

### 3. Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Abrir en el navegador
```
http://localhost:5173
```

---

## 🐳 Instalación con Docker

```bash
# Copiar variables de entorno
cp .env.example .env

# Levantar todos los servicios
docker-compose up -d

# Ejecutar migraciones y seed
docker exec bateria-backend npx prisma migrate deploy
docker exec bateria-backend node prisma/seed.js

# Abrir en el navegador
open http://localhost
```

---

## 🔐 Seguridad

### OWASP Top 10 Implementado

| Vulnerabilidad | Mitigación |
|---------------|-----------|
| A01 - Broken Access Control | RBAC + JWT + middleware authorize |
| A02 - Criptographic Failures | bcrypt (12 rounds) + JWT con rotación |
| A03 - Injection | Prisma ORM (parameterized) + Zod validation |
| A04 - Insecure Design | Clean Architecture + input sanitization |
| A05 - Security Misconfiguration | Helmet + CORS estricto + env validation |
| A06 - Vulnerable Components | Dependencias auditadas + npm audit |
| A07 - Auth Failures | Rate limiting en /auth + password policy |
| A08 - Data Integrity | Validación Zod en todas las entradas |
| A09 - Logging Failures | Winston logger sin datos sensibles |
| A10 - SSRF | No se realizan requests a URLs externas |

---

## 📡 API Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Registro de usuario |
| POST | `/api/v1/auth/login` | Inicio de sesión |
| POST | `/api/v1/auth/refresh` | Renovar access token |
| POST | `/api/v1/auth/logout` | Cerrar sesión |

### Topics
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/topics` | Listar temas con progreso |
| GET | `/api/v1/topics/:id` | Detalle de tema |

### Questions
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/questions/no-fail/:topicId` | Modo sin fallos |
| GET | `/api/v1/questions/review` | Preguntas para repaso |
| POST | `/api/v1/questions/answer` | Responder pregunta |

### Tests
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/tests` | Crear test |
| POST | `/api/v1/tests/:id/answer` | Responder pregunta del test |
| POST | `/api/v1/tests/:id/complete` | Finalizar test |
| GET | `/api/v1/tests/history` | Historial de tests |

### Stats
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/stats` | Estadísticas completas |
| GET | `/api/v1/stats/mistakes` | Banco de errores |
| GET | `/api/v1/stats/achievements` | Logros |
| POST | `/api/v1/stats/bookmarks` | Marcar pregunta |

### Study Plans
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/study-plans/generate` | Generar plan automático |
| GET | `/api/v1/study-plans/today` | Plan de hoy |

---

## 📁 Estructura del Proyecto

```
bateriaDePreguntas/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Modelos de base de datos
│   │   └── seed.js                # Datos iniciales
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js        # Prisma client singleton
│   │   │   ├── env.js             # Variables de entorno (Zod)
│   │   │   └── logger.js          # Winston logger
│   │   ├── controllers/           # Capa de interfaz
│   │   │   ├── authController.js
│   │   │   ├── questionController.js
│   │   │   ├── statsController.js
│   │   │   ├── studyPlanController.js
│   │   │   ├── testController.js
│   │   │   ├── topicController.js
│   │   │   └── userController.js
│   │   ├── middleware/            # Seguridad y validación
│   │   │   ├── auth.js           # JWT authentication
│   │   │   ├── authorize.js      # RBAC
│   │   │   ├── errorHandler.js   # Global error handler
│   │   │   ├── security.js       # CORS, Helmet, Rate Limit
│   │   │   └── validate.js       # Zod validation
│   │   ├── services/             # Lógica de negocio
│   │   │   ├── authService.js
│   │   │   ├── questionService.js
│   │   │   ├── statsService.js
│   │   │   ├── studyPlanService.js
│   │   │   ├── testService.js
│   │   │   ├── topicService.js
│   │   │   └── userService.js
│   │   ├── utils/
│   │   │   ├── AppError.js       # Custom error class
│   │   │   ├── asyncHandler.js   # Async error wrapper
│   │   │   └── spacedRepetition.js # Algoritmo SM-2
│   │   ├── validators/
│   │   │   └── schemas.js        # Zod schemas
│   │   ├── routes/
│   │   │   └── index.js          # Todas las rutas
│   │   ├── app.js                # Express setup
│   │   └── server.js             # Entry point
│   ├── tests/
│   │   └── unit.test.js          # Tests unitarios
│   ├── Dockerfile
│   ├── package.json
│   └── jest.config.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── Navbar.css
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Estado de autenticación
│   │   │   └── ToastContext.jsx  # Notificaciones
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Panel principal
│   │   │   ├── Login.jsx         # Inicio de sesión
│   │   │   ├── Register.jsx      # Registro
│   │   │   ├── Topics.jsx        # Lista de temas
│   │   │   ├── TopicDetail.jsx   # Detalle de tema
│   │   │   ├── NoFailMode.jsx    # Modo sin fallos ⭐
│   │   │   ├── TestSetup.jsx     # Configurar test
│   │   │   ├── TestPlay.jsx      # Realizar test
│   │   │   ├── TestResult.jsx    # Resultado de test
│   │   │   ├── Mistakes.jsx      # Banco de errores
│   │   │   ├── Stats.jsx         # Estadísticas
│   │   │   ├── Planner.jsx       # Planificador
│   │   │   └── Profile.jsx       # Perfil y ajustes
│   │   ├── services/
│   │   │   └── api.js            # Cliente API
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css             # Design system
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🧪 Testing

```bash
cd backend

# Ejecutar tests unitarios
npm test

# Con coverage
npm test -- --coverage
```

Tests incluidos:
- ✅ AppError class
- ✅ Algoritmo de Repetición Espaciada (SM-2)
- ✅ Schemas de validación Zod (registro, login, preguntas)

---

## 👤 Usuarios Demo

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@bateriapreguntas.com | Admin@2024! |
| Usuario | demo@bateriapreguntas.com | User@2024! |

---

## 🚀 Mejoras Futuras

### Próxima iteración
- [ ] 🤖 IA para detectar puntos débiles y generar tests personalizados
- [ ] 📱 App móvil con React Native
- [ ] 📊 Comparativa con otros usuarios (percentil)
- [ ] 🎧 Audios y esquemas visuales por tema
- [ ] 🔔 Notificaciones push de recordatorio
- [ ] 📄 Integración con PDFs del temario
- [ ] 💬 Explicaciones inteligentes con IA

### Mejoras técnicas
- [ ] Redis para caché de sesiones y rate limiting
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitorización con Prometheus + Grafana
- [ ] Backup automático de base de datos
- [ ] CDN para assets estáticos
- [ ] Internacionalización (i18n)

### Monetización (Freemium)
- [ ] Plan gratuito: 3 temas + 1 test/día
- [ ] Plan premium: Todo ilimitado + estadísticas avanzadas + simulacros
- [ ] Pasarela de pago (Stripe)

---

## 📄 Licencia

MIT License — Uso libre para proyectos personales y comerciales.

---

**Desarrollado con ❤️ para opositores que quieren aprobar.**
