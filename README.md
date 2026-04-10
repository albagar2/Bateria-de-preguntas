<div align="center">

![Batería de Preguntas Banner](media/banner.png)

# 🎯 BATERÍA DE PREGUNTAS
### `INTEL_EDUCATIONAL_ECOSYSTEM_v2.0`

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
[![AI-Tutor](https://img.shields.io/badge/AI--Tutor-Gemini%20Pro-blueviolet.svg?style=for-the-badge&logo=google-gemini)](#-arquitectura-ia)

**BateriaQ** is a mission-critical adaptive learning platform. It combines a distributed microservices architecture with an AI core to deliver a high-performance study experience.

</div>

---

### 📖 DOCUMENTACIÓN ESTRATÉGICA

> [!IMPORTANT]
> Hemos preparado guías detalladas para maximizar tu rendimiento:

- **[🎓 Manual del Estudiante](docs/MANUAL_ESTUDIANTE.md)**: Domina el ritmo de estudio y el Tutor IA.
- **[🛠 Manual del Administrador](docs/MANUAL_ADMIN.md)**: Gestión de activos, usuarios y telemetría de contenido.

---

### 🏗️ ARQUITECTURA DEL ECOSISTEMA

```mermaid
graph TD
    User((Usuario)) --> FE[Frontend React HUD]
    FE --> GW[API Gateway / Backend]
    GW --> DB[(PostgreSQL Cluster)]
    GW --> AI_S[AI Microservice]
    AI_S --> Gemini[Google Gemini AI]
    AI_S --> Cache[(SQLite Intelligent Cache)]
```

#### 📡 Capas del Sistema:
1.  **API Gateway**: Motor logístico con **Clean Architecture**. Gestión de JWT y persistencia.
2.  **AI Microservice**: Capa aislada con **Model Fallback** (Gemini Pro/Flash) y persistencia en caché SQLite.
3.  **Frontend HUD**: Interfaz "Dark-First" con **Glassmorphism 4.0** y diseño resiliente.

---

### 🔥 CARACTERÍSTICAS DE ÉLITE

#### 🤖 Inteligencia Contextual
- **Tutor Personal 24/7**: Chat cognitivo integrado para resolución de dudas en tiempo real.
- **Explicaciones Estratégicas**: Mnemotecnias generadas por IA basadas en patrones de error.

#### 📚 Metodologías de Alto Rendimiento
- **Algoritmo SM-2**: Repetición espaciada para memoria profunda.
- **Modo Sin Fallos**: Bloqueo de progresión por maestría de bloque.
- **Contenido Comunitario**: Los usuarios pueden crear sus propias oposiciones, temas y preguntas.

---

### 🚀 DESPLIEGUE RÁPIDO (DOCKER_ENGINE)

Inicia el ecosistema completo en segundos:

```bash
# 1. Configurar Entorno
cp .env.example .env

# 2. Ignición de Infraestructura
docker-compose up -d --build

# 3. Protocolo de Datos (Seed)
docker exec bateria-backend npx prisma migrate deploy
docker exec bateria-backend node prisma/seed.js
```

> **Access URL**: `http://localhost`  
> **Admin Credentials**: `admin@bateriapreguntas.com` / `Admin@2024!`

---

### 👤 MATRIZ DE ACCESO

| Rol | Credenciales | Privilegios |
| :--- | :--- | :--- |
| **Administrador** | `admin@bateriapreguntas.com` | Control Total CMS / Salud del Sistema |
| **Estudiante** | `demo@bateriapreguntas.com` | Estudiar / Crear Propias Oposiciones, Temas y Preguntas |

---

<div align="center">

© 2026 **ALBA-OS EDUCATIONAL DIVISION**
*Desarrollado para opositores que buscan la excelencia absoluta.*

</div>
