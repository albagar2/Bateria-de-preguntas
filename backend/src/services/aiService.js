// ============================================
// AI Service — Integrated Gemini AI logic
// ============================================
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { prisma } = require('../config/database');
const crypto = require('crypto');
const mammoth = require('mammoth');

const MODEL_POOL = [
  'models/gemini-1.5-flash-latest',
  'models/gemini-1.5-flash',
  'models/gemini-1.5-pro-latest',
  'models/gemini-1.5-pro',
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
      console.log(`[AI Service] Intentando con modelo: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
      
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
 * Supports: PDF, Images, Word (docx), and Plain Text
 */
async function scanDocument({ fileBase64, mimeType, topicHint, textContent }) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY no configurada.');
  }

  let prompt = `
    ROL: Extractor de datos pedagógicos experto.
    TAREA: Analiza el contenido adjunto y extrae todas las preguntas de tipo test (opción múltiple) que encuentres.
    CONTEXTO DEL TEMA: ${topicHint || 'Oposiciones'}
    
    REGLAS DE ORO:
    1. Devuelve EXCLUSIVAMENTE un bloque JSON válido (array de objetos).
    2. Estructura: [{"questionText": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0, "explanation": "..."}]
    3. Todas las preguntas deben tener exactamente 4 opciones. Si faltan, invéntalas.
    4. El "correctIndex" es el índice (0-3) de la opción verdadera.
    5. "explanation" debe ser una breve frase justificando la respuesta.
    6. NO incluyas explicaciones fuera del JSON.
  `.trim();

  let aiContent = [];
  try {
    // Case 1: Plain Text provided directly
    if (textContent) {
      console.log('[AI Service] Usando texto plano proporcionado.');
      prompt += `\n\nCONTENIDO A ANALIZAR:\n${textContent}`;
      aiContent = [prompt];
    } 
    // Case 2: Word Document (docx)
    else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('[AI Service] Extrayendo texto de DOCX...');
      const buffer = Buffer.from(fileBase64, 'base64');
      const result = await mammoth.extractRawText({ buffer });
      console.log(`[AI Service] Texto extraído (${result.value.length} caracteres)`);
      prompt += `\n\nCONTENIDO EXTRAÍDO DEL WORD:\n${result.value}`;
      aiContent = [prompt];
    }
    // Case 3: PDF or Image (Multimodal)
    else if (fileBase64) {
      console.log(`[AI Service] Preparando contenido multimodal (Type: ${mimeType})`);
      aiContent = [
        {
          inlineData: {
            data: fileBase64,
            mimeType: mimeType || 'application/pdf'
          }
        },
        prompt
      ];
    } else {
      throw new Error('No se ha proporcionado contenido para escanear.');
    }

    // --- Resilient AI Call (Fallback Loop) ---
    const testModels = [
      { name: 'gemini-1.5-flash', v: 'v1' },
      { name: 'gemini-1.5-flash', v: 'v1beta' },
      { name: 'gemini-pro', v: 'v1' },
      { name: 'gemini-1.5-flash-latest', v: 'v1beta' }
    ];

    let lastError = null;
    let text = null;

    for (const m of testModels) {
      try {
        console.log(`[AI Service] Intentando escaneo con: ${m.name} (${m.v})`);
        const model = genAI.getGenerativeModel({ model: m.name }, { apiVersion: m.v });
        const result = await model.generateContent(aiContent);
        text = result.response.text();
        if (text) break; 
      } catch (err) {
        console.warn(`[AI Service] Falló ${m.name} (${m.v}): ${err.message}`);
        lastError = err;
      }
    }

    if (!text) {
      throw new Error(`Google Gemini no responde. Revisa que tu API Key tenga habilitada la 'Generative Language API'. Error original: ${lastError?.message}`);
    }

    console.log(`[AI Service] Respuesta recibida (${text.length} caracteres)`);
    
    // Clean JSON from potential markdown backticks
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanJson);
      console.log(`[AI Service] JSON parseado correctamente: ${parsed.length} preguntas extraídas.`);
      return parsed;
    } catch (parseError) {
      console.error('[AI Service] Error al parsear JSON de la IA:', text);
      throw new Error('La IA no devolvió un formato válido. Inténtalo de nuevo con menos texto o un formato más claro.');
    }
  } catch (error) {
    console.error('[AI Service] Error final en escaneo:', error.message);
    throw new Error(error.message || 'Error al procesar el archivo. Asegúrate de que sea legible.');
  }
}

module.exports = {
  generateExplanation,
  askQuestion,
  generateStudyStrategy,
  scanDocument,
};
