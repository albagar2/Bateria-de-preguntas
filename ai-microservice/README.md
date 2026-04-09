# 🤖 BateriaQ AI Microservice

Capa de inteligencia distribuida diseñada para ofrecer mentoría y tutorización en tiempo real mediante modelos de lenguaje de gran escala (LLM).

## 🚀 Características Avanzadas

### 1. Model Fallback System (Arquitectura de Resiliencia)
El servicio utiliza un **Pool de Modelos** (Gemini Pro y Gemini Flash) en cascada. Si el modelo principal experimenta latencia o sobrecarga, el sistema conmuta automáticamente al modelo de respaldo para garantizar que el estudiante nunca se quede sin respuesta.

### 2. Capa de Caché Inteligente (SQLite)
Para optimizar costes de API y reducir la latencia al mínimo:
- Todas las explicaciones de preguntas se almacenan en una base de datos **SQLite aislada**.
- Si varios alumnos consultan la misma pregunta, la respuesta se sirve desde el caché instantáneamente.

### 3. Tutoría Multimodal
- **Explicador**: Analiza fallos técnicos.
- **Mentor**: Resuelve dudas generales mediante lenguaje natural.
- **Mnemotecnias**: Generación creativa de reglas memorísticas.

## 🛠 Configuración
Requiere una `GEMINI_API_KEY` válida instalada en el entorno o en un archivo `.env`.

## 📡 API Local
- `POST /api/v1/generate-explanation`: Genera una base técnica para un fallo.
- `POST /api/v1/ask`: Interfaz de chat con el Tutor IA.

---
**El futuro del estudio inteligente impulsado por IA.**
