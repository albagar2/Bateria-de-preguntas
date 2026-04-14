// ============================================
// AI Service — Integrated Gemini AI logic
// ============================================
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { prisma } = require('../config/database');
const crypto = require('crypto');

const MODEL_POOL = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
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
      console.log(`[AI Service] Intentando con modelo: ${modelName} (API v1)`);
      
      // Forzamos explícitamente la versión v1 para evitar el error 404 de v1beta
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
      
      const response = await model.generateContent(prompt);
      const text = response.response.text();

      if (!text) throw new Error('Respuesta vacía de la IA');

      return { text, modelUsed: modelName };
    } catch (error) {
      lastError = error;
      console.error(`[AI Service] Error CRÍTICO con modelo ${modelName}:`, error.message);
      
      const isOverloaded = error.status === 503 || error.status === 429;
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

module.exports = {
  generateExplanation,
  askQuestion,
  generateStudyStrategy,
};
