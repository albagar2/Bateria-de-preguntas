# 🎯 BateriaQ — Plataforma de Oposiciones de Élite

![BateriaQ Banner](https://img.shields.io/badge/AESTHETICS-PREMIUM-indigo?style=for-the-badge)
![Status](https://img.shields.io/badge/STATUS-PRODUCTION--READY-brightgreen?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/STACK-FULLSTACK-blue?style=for-the-badge)

**BateriaQ** es un ecosistema de estudio revolucionario diseñado para opositores que buscan maximizar su rendimiento. Utiliza algoritmos de planificación inteligente e Inteligencia Artificial para transformar el tedioso estudio de leyes en un proceso dinámico y visual.

---

## 🚀 Características Destacadas

### 📅 Planificador Estratégico IA
Un calendario visual basado en una cuadrícula semanal que organiza automáticamente tus temas en base a la fecha de tu examen.
*   **IA Tutor**: Consejos tácticos personalizados para abordar tu semana de estudio.
*   **Gestión One-Touch**: Marca y desmarca tareas directamente en el calendario o Dashboard.

### 🧪 Entrenamiento de Alto Rendimiento
*   **Modo Sin Fallos**: Un reto infinito donde una sola respuesta incorrecta termina la racha. Ideal para perfeccionar la precisión.
*   **Tests Personalizados**: Filtra por temas, subtemas y dificultad.

### 🤖 Soporte Legal con IA
¿Dudas con un artículo? Nuestra IA integrada explica cada pregunta basándose en la normativa vigente, ahorrándote horas de búsqueda en el BOE.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React (Vite), CSS3 Premium, Context API |
| **Backend** | Node.js, Express, Prisma ORM |
| **BBDD** | PostgreSQL (Supabase) |
| **IA** | Microservicio dedicado con LLM |
| **Despliegue** | Vercel (Frontend/Backend) & Supabase |

---

## 📦 Instalación y Despliegue

### Requisitos Previos
- Node.js (v18+)
- Cuenta en Supabase y Vercel

### Paso a paso
1. **Clonar y descargar dependencias**:
   ```bash
   git clone https://github.com/albagar2/Bateria-de-preguntas
   cd bateria-preguntas
   npm install
   ```

2. **Configurar Base de Datos**:
   - Crea un proyecto en Supabase.
   - Ejecuta el script `supabase_schema.sql` en el SQL Editor.

3. **Variables de Entorno (.env)**:
   ```env
   DATABASE_URL="tu-url-de-supabase"
   JWT_SECRET="tu-clave-secreta"
   AI_SERVICE_URL="tu-url-de-ia"
   ```

4. **Lanzar en local**:
   ```bash
   # En terminales separadas
   npm run dev:backend
   npm run dev:frontend
   ```

---

## 📜 Derechos y Propiedad Intelectual

© 2026 **BateriaQ Study Platform**. Todos los derechos reservados.
Queda prohibida la reproducción total o parcial del código, diseño o algoritmos de planificación sin autorización expresa del autor.

---

*Desarrollado con ❤️ para opositores imparables.*
