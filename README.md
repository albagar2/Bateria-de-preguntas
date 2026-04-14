# 🎯 BateriaQ — La Plataforma de Oposiciones Definitiva

![BateriaQ Banner](https://img.shields.io/badge/AESTHETICS-PREMIUM-indigo?style=for-the-badge)
![Status](https://img.shields.io/badge/STATUS-PRODUCTION--READY-10b981?style=for-the-badge)
![IA](https://img.shields.io/badge/IA-INTEGRATED-blue?style=for-the-badge)
![Gamificación](https://img.shields.io/badge/METODO-GAMIFIED-f59e0b?style=for-the-badge)

**BateriaQ** es un ecosistema de estudio de alto rendimiento diseñado para opositores. No es solo un banco de preguntas; es una herramienta de precisión que combina Inteligencia Artificial, Repetición Espaciada y Gamificación para convertir el estudio en un proceso adictivo y eficiente.

---

## 💎 Características Premium (v2.0)

### 🤖 Tutor IA 24/7 (Gemini Integrated)
Ya no necesitas buscar en el BOE. Nuestra IA integrada explica cada pregunta, resuelve dudas legales y genera estrategias de estudio personalizadas basadas en tu ritmo real.

### 📅 Planificador Mensual Estratégico
Visualiza tu éxito a **30 días vista**. Un calendario dinámico que organiza tus temas, sincroniza tareas con tu Dashboard y ajusta la carga de trabajo según tu fecha de examen.

### 🏆 Gamificación y Logros
Mantente motivado con nuestro sistema de medallas. Gana trofeos como *"Búho Nocturno"*, *"Relámpago"* o *"Constancia"* mientras completas tus objetivos diarios.

### 📉 Analítica Avanzada y Exportación PDF
Dashboard visual con gráficos de rendimiento de los últimos 30 días. Analiza tus puntos ciegos y genera **informes de progreso en PDF** para llevar un control profesional de tu evolución.

### 🎴 Modo Flashcards 3D
Entrena tu memoria activa con nuestro sistema de cartas interactivas. Ideal para repasar conceptos, definiciones y plazos legales de forma rápida y visual.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React, Recharts (Gráficos), Framer Motion (Animaciones), Lucide Icons |
| **Backend** | Node.js, Express, Prisma ORM |
| **BBDD** | PostgreSQL (Supabase) con sistema de **AICache** |
| **Inteligencia Artificial** | Google Generative AI (Gemini 1.5 Flash/Pro) |
| **Arquitectura** | Monolito Unificado (Optimizado para Vercel Serverless) |

---

## 🚀 Instalación y Despliegue

### Requisitos Previos
- Node.js (v18+)
- Cuenta en Supabase (PostgreSQL)
- Google AI Studio API Key (Gemini)

### Configuración de Variables de Entorno (.env)
```env
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true"
JWT_SECRET="tu-clave-secreta"
GEMINI_API_KEY="tu-clave-de-google-ai-studio"
FRONTEND_URL="http://localhost:5173"
```

### Comandos de Inicio
```bash
# Sincronizar Base de Datos
npx prisma db push

# Iniciar Backend
cd backend && npm run dev

# Iniciar Frontend
cd frontend && npm run dev
```

---

## 📜 Propiedad Intelectual
© 2026 **BateriaQ Study Ecosystem**. Todos los derechos reservados.
Desarrollado con pasión para ayudar a opositores imparables a conseguir su plaza.

---
*BateriaQ: Estudia menos, domina más.*
