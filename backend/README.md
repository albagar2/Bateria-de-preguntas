# 🧠 BateriaQ Backend — API Gateway & Logic Layer

Este es el núcleo de la plataforma, encargado de la orquestación de datos, la seguridad y la lógica de negocio de las oposiciones.

## 🚀 Tecnologías Core
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL 15 (vía Prisma ORM)
- **Seguridad**: JWT (Stateless), Bcrypt, Helmet, Rate Limiting.
- **Validación**: Zod (Type-safe schemas).

## 🏗 Arquitectura
El backend sigue los principios de **Clean Architecture**:
- `src/controllers`: Manejo de la interfaz HTTP y respuestas estandarizadas (`ApiResponse`).
- `src/services`: Lógica de negocio pura (cálculo de SM-2, generación de planes, etc).
- `src/middleware`: Capas de seguridad y validación.
- `src/routes`: Definición de endpoints.

## 📡 Endpoints Clave

### Administración (`/admin`)
- `GET /stats`: Estadísticas globales del sistema.
- `GET /users`: Listado de usuarios.
- `CRUD /questions`: Gestión del banco de preguntas.
- `CRUD /topics`: Gestión de temas.

### Estudio e IA (`/ai`, `/topics`, `/tests`)
- `POST /ai/explain`: Petición de explicación detallada a la IA.
- `POST /ai/ask`: Chat con el Tutor IA.
- `POST /tests`: Generación dinámica de exámenes.

## 🛠 Instalación Local
1. `npm install`
2. `npx prisma migrate dev`
3. `npm run dev`

---
**Desarrollado para ser robusto, escalable y seguro.**
