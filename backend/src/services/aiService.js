// ============================================
// AI Service — Integrated Gemini AI logic
// ============================================
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { prisma } = require('../config/database');
const crypto = require('crypto');

const MODEL_POOL = [
  'gemini-1.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
];

/**
 * Initialize Gemini client
 */
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Delay helper for exponential backoff
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Core function to query Gemini with Model Fallback and Retry logic
 */
async function callGeminiWithFallback(prompt) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY no configurada en las variables de entorno.');
  }

  let lastError = null;
  let retryCount = 0;
  let backoffDelay = 2000;

  for (let i = 0; i < MODEL_POOL.length; i++) {
    const modelName = MODEL_POOL[i];
    try {
      console.log(`[AI Service] Intentando con modelo: ${modelName} (API v1beta)`);
      
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
      
      const response = await model.generateContent(prompt);
      const text = response.response.text();

      if (!text) throw new Error('Respuesta vacía de la IA');

      return { text, modelUsed: modelName };
    } catch (error) {
      lastError = error;
      const errorMessage = error.message || '';
      console.error(`[AI Service] Error con modelo ${modelName}:`, errorMessage);
      
      const isOverloaded = error.status === 503 || error.status === 429;
      const isQuotaExceeded = errorMessage.toLowerCase().includes('quota') || errorMessage.includes('429');

      // If quota exceeded, don't retry this model, move immediately to next
      if (isQuotaExceeded) {
        console.warn(`[AI Service] Cuota excedida para ${modelName}. Saltando al siguiente modelo...`);
        retryCount = 0;
        backoffDelay = 2000;
        continue;
      }

      if (isOverloaded && retryCount < 2) {
        console.log(`[AI Service] Servidor sobrecargado. Reintentando en ${backoffDelay}ms...`);
        await delay(backoffDelay);
        backoffDelay *= 2;
        retryCount++;
        i--; 
        continue;
      }
      retryCount = 0;
      backoffDelay = 2000;
    }
  }
  throw new Error(`No se pudo obtener respuesta de la IA tras intentar con varios modelos. Último error: ${lastError?.message || 'Desconocido'}`);
}

/**
 * Generate a deterministic hash key for caching
 */
function generateHashKey(text, type, difficulty = '') {
  const keyString = `${type}_${difficulty}_${text}`.toLowerCase().trim();
  return crypto.createHash('sha256').update(keyString).digest('hex');
}

/**
 * Get study explanation for a question
 */
async function generateExplanation({ questionId, questionText, correctAnswer, selectedAnswer, difficulty }) {
  const hashKey = generateHashKey(questionText, 'explanation', difficulty);

  // 1. Check DB Cache
  const cached = await prisma.aICache.findUnique({ where: { hashKey } });
  if (cached) {
    console.log('[AI Cache] Hit para explicación');
    return {
      explanation: cached.content,
      modelUsed: cached.modelUsed,
      cached: true
    };
  }

  // 2. Prepare Prompt
  let toneInstruction = "Usa un lenguaje formal y directo.";
  if (difficulty === "EASY") {
    toneInstruction = "Explícalo de forma muy sencilla, como para un principiante.";
  } else if (difficulty === "HARD") {
    toneInstruction = "Da una explicación técnica y detallada, citando leyes si aplica.";
  }

  const prompt = `
    ROL: Tutor experto en oposiciones.
    PREGUNTA: "${questionText}"
    RESPUESTA CORRECTA: "${correctAnswer}"
    ${selectedAnswer ? `EL ALUMNO FALLÓ MARCANDO: "${selectedAnswer}"` : ''}
    
    TAREA: Explica por qué la respuesta es correcta y por qué la del alumno (si la hay) falla. 
    Sé conciso (máx 3 frases), indica un truco nemotécnico si es posible y cita la ley si aplica.
    ESTILO: ${toneInstruction} VE DIRECTO AL GRANO.
  `.trim();

  // 3. Call AI
  const { text, modelUsed } = await callGeminiWithFallback(prompt);

  // 4. Save to Cache
  await prisma.aICache.create({
    data: {
      hashKey,
      questionId,
      content: text,
      modelUsed,
      difficulty,
      type: 'explanation'
    }
  }).catch(err => console.error('[AI Cache] Error saving:', err));

  return { explanation: text, modelUsed, cached: false };
}

/**
 * Study Plan Strategic Advice
 */
async function generateStudyStrategy({ plan, userProgress, daysToExam }) {
  const prompt = `
    ROL: Estratega de Estudios de BateriaQ.
    PLAN SEMANAL: ${JSON.stringify(plan)}
    PROGRESO: ${userProgress} temas respondidos.
    DÍAS AL EXAMEN: ${daysToExam}
    
    TAREA: Analiza el plan y genera un consejo corto (max 50 palabras).
    Menciona algo específico sobre la carga o constancia.
    ESTILO: Motivador y táctico. VE DIRECTO AL GRANO.
  `.trim();

  const { text } = await callGeminiWithFallback(prompt);
  return { advice: text };
}

/**
 * General Chat Question
 */
async function askQuestion({ question, topic, name }) {
  const prompt = `
    ROL: Tutor IA de BateriaQ experto en oposiciones.
    USUARIO: ${name || 'Estudiante'}
    CONTEXTO: Estudiando ${topic || 'Temario General'}.
    DUDA: "${question}"
    
    INSTRUCCIONES: Responde de forma clara y pedagógica. Máximo 200 palabras.
    VE DIRECTO AL GRANO, NO SALUDES.
  `.trim();

  const { text, modelUsed } = await callGeminiWithFallback(prompt);
  return { answer: text, modelUsed };
}

/**
 * Scan document and extract questions using Gemini Multimodal
 */
async function scanDocument({ fileBase64, mimeType, topicHint }) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY no configurada.');
  }

  const modelName = 'gemini-1.5-flash'; 
  const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });

  const prompt = `
    ROL: Extractor de datos pedagógicos experto.
    TAREA: Analiza el documento adjunto y extrae todas las preguntas de tipo test (opción múltiple) que encuentres.
    CONTEXTO DEL TEMA: ${topicHint || 'Oposiciones'}
    
    REGLAS DE ORO:
    1. Devuelve EXCLUSIVAMENTE un bloque JSON válido (array de objetos).
    2. Estructura: [{"questionText": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0, "explanation": "..."}]
    3. Todas las preguntas deben tener exactamente 4 opciones. Si faltan, invéntalas.
    4. El "correctIndex" es el índice (0-3) de la opción verdadera.
    5. "explanation" debe ser una breve frase justificando la respuesta.
    6. NO incluyas explicaciones fuera del JSON.
  `.trim();

  try {
    console.log(`[AI Service] Escaneando documento multimodal (Type: ${mimeType})...`);
    
    const result = await model.generateContent([
      {
        inlineData: {
          data: fileBase64,
          mimeType: mimeType || 'application/pdf'
        }
      },
      prompt
    ]);

    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('[AI Service] Error en escaneo:', error.message);
    throw new Error('Error al procesar el archivo. Asegúrate de que no esté protegido por contraseña y sea legible.');
  }
}

module.exports = {
  generateExplanation,
  askQuestion,
  generateStudyStrategy,
  scanDocument,
};
