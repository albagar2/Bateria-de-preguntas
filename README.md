# 🎯 BateriaQ — La Plataforma de Oposiciones Definitiva

![BateriaQ Banner](https://img.shields.io/badge/AESTHETICS-PREMIUM-indigo?style=for-the-badge)
![Status](https://img.shields.io/badge/STATUS-PRODUCTION--READY-10b981?style=for-the-badge)
![IA](https://img.shields.io/badge/IA-INTEGRATED-blue?style=for-the-badge)
![Gamificación](https://img.shields.io/badge/METODO-GAMIFIED-f59e0b?style=for-the-badge)

**BateriaQ** es un ecosistema de estudio de alto rendimiento diseñado para opositores. No es solo un banco de preguntas; es una herramienta de precisión que combina Inteligencia Artificial, Repetición Espaciada y Gamificación para convertir el estudio en un proceso adictivo y eficiente.

---

## 💎 Características Premium (v2.1)

### 🤖 Escaneo Inteligente de Documentos (NEW)
¡Olvídate de transcribir! Sube un **PDF o una foto de un test** y nuestra IA multimodal (Gemini 1.5 Vision) extraerá automáticamente las preguntas, opciones, respuestas correctas y generará explicaciones didácticas en segundos.

### ⚡ Shortcuts para Opositores de Élite
Diseñado para la velocidad. Controla toda la interfaz con el teclado:
- **A, B, C, D**: Selecciona opciones instantáneamente.
- **Enter**: Confirma respuesta o pasa a la siguiente pregunta.
- **M**: Marca preguntas para revisión posterior.

### 💀 Modo Sin Fallos (Hardcore Mode)
El entrenamiento definitivo para la perfección. Una sola respuesta incorrecta y vuelves al inicio del tema. Ideal para memorizar leyes y conceptos críticos donde el error no es una opción.

### 🔄 Randomización Inteligente (Anti-Memorización)
Las respuestas se barajan en cada intento. Evita la "memoria visual" de la posición (la respuesta A no siempre será la A), obligando al estudiante a leer y razonar en cada iteración.

### 🧠 Pool de Modelos IA con Fallback
Arquitectura de alta disponibilidad para la IA. Si un modelo alcanza su cuota, el sistema conmuta automáticamente entre **Gemini 1.5 Flash, 2.0 Flash y 1.5 Pro** en milisegundos, asegurando que nunca te quedes sin tutoría.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 18, Vite, Framer Motion, Context API |
| **Backend** | Node.js, Express, Prisma ORM, JWT |
| **BBDD Cache** | SQLite (Better-SQLite3) + Redis-ready layers |
| **IA Multimodal** | Google Generative AI (Vision + Text) |
| **Arquitectura** | Microservicios de apoyo + Monolito Unificado |

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

## 📜 Propiedad Intelectual e Identidad
Este proyecto ha sido concebido, diseñado y desarrollado íntegramente por **Alba García López**.

© 2026 **BateriaQ Study Ecosystem** — Todos los derechos reservados.
Desarrollado con pasión para ayudar a opositores imparables a conseguir su plaza. 🚀

---
*BateriaQ: Estudia menos, domina más.*
