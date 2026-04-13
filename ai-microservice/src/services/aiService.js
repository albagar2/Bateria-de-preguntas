const { GoogleGenerativeAI } = require('@google/generative-ai');
const cache = require('../db/cache');

const MODEL_POOL = [
    'gemini-2.0-flash',
    'gemini-flash-latest',
];

// In a real environment, you might use 3.1 depending on API availability
// MODEL_POOL = ['gemini-3.1-pro', 'gemini-2.5-pro', 'gemini-2.5-flash'];

/**
 * Initialize Gemini client
 * Fallbacks won't work if GEMINI_API_KEY is not set in .env
 */
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Delay helper for exponential backoff
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Core function to query Gemini with Model Fallback and Retry logic
 */
async function callGeminiWithFallback(prompt) {
    if (!genAI) {
        throw new Error('GEMINI_API_KEY no configurada. Por favor, añádela al .env');
    }

    let retryCount = 0;
    let backoffDelay = 2000; // start with 2s

    for (let i = 0; i < MODEL_POOL.length; i++) {
        const modelName = MODEL_POOL[i];
        
        try {
            console.log(`[AI Layer] Intentando con modelo: ${modelName}`);
            
            const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
            const response = await model.generateContent(prompt);

            return {
                text: response.response.text(),
                modelUsed: modelName
            };

        } catch (error) {
            console.warn(`[AI Layer] El modelo ${modelName} falló:`, error.message);
            
            // Check if it's a 503 or 429 (rate limit / server overloaded)
            const isOverloaded = error.status === 503 || error.status === 429;
            
            if (isOverloaded && retryCount < 2) {
                // Retry same model with exponential backoff before falling back
                console.log(`[AI Layer] Sobrecarga detectada. Esperando ${backoffDelay}ms...`);
                await delay(backoffDelay);
                backoffDelay *= 2; 
                retryCount++;
                i--; // Decrement i to retry the same model
                continue;
            }
            
            // If it reaches here, it either exhausted retries or wasn't a 503
            // It will naturally loop to the next model in MODEL_POOL
            retryCount = 0; // reset for next model
            backoffDelay = 2000;
        }
    }

    throw new Error('Todos los modelos del Pool fallaron.');
}

/**
 * Main logical function for explanations
 */
async function generateExplanation({ question_id, user_id, question_text, correct_answer, selected_answer, difficulty }) {
    // 1. Check Cache Layer first
    const hashKey = cache.generateHashKey(question_text, difficulty);
    const cachedEntry = cache.getExplanation.get(hashKey);

    if (cachedEntry) {
        console.log(`[Cache] Hit para question: ${question_id || 'N/A'}`);
        return {
            question_id: question_id || null,
            user_id: user_id || null,
            model_used: cachedEntry.model_used,
            explanation: cachedEntry.explanation,
            difficulty_level: cachedEntry.difficulty_level,
            cached: true,
            created_at: cachedEntry.created_at
        };
    }

    // 2. Not in Cache, Prepare prompt
    // We adjust the prompt tone depending on the difficulty
    let toneInstruction = "Usa un lenguaje formal y directo.";
    if (difficulty === "basic") {
        toneInstruction = "Explícalo de forma muy sencilla, con una analogía fácil de entender, como para un principiante.";
    } else if (difficulty === "advanced") {
        toneInstruction = "Da una explicación muy técnica y detallada, citando si es posible normativa legal genérica aplicable a oposiciones.";
    }

    const prompt = `
    ROL: Eres un tutor experto en preparación de oposiciones de élite. Tu objetivo es que el alumno no vuelva a fallar nunca esta pregunta.
    
    CONTEXTO:
    Pregunta: "${question_text}"
    Respuesta Correcta: "${correct_answer}"
    ${selected_answer ? `El alumno marcó INCORRECTAMENTE: "${selected_answer}"` : 'El alumno solicitó una explicación.'}
    
    INSTRUCCIONES DE RESPUESTA:
    1. EXPLICACIÓN: Explica la base legal o lógica de forma cristalinamente clara. Si el alumno falló, dile sutilmente por qué su opción era una "trampa" común. (Máx 3 frases).
    2. TRUCO MNEMOTÉCNICO: Si es posible, aporta una regla corta o acrónimo para memorizar esto.
    3. CITA LEGAL: Si aplica, indica el Artículo o Ley relacionado.
    
    ESTILO: ${toneInstruction}
    SÉ DIRECTO. No saludes. No digas "Claro, aquí tienes". Ve al grano con el conocimiento puro.
    `.trim();

    // 3. Consult Model Pool
    console.log(`[AI Layer] Cache miss. Generando explicación...`);
    const { text, modelUsed } = await callGeminiWithFallback(prompt);

    // 4. Save to Cache
    cache.insertExplanation.run({
        hash_key: hashKey,
        question_id: question_id || 'unknown',
        explanation: text,
        model_used: modelUsed,
        difficulty_level: difficulty
    });

    // 5. Return formulated response
    return {
        question_id: question_id || null,
        user_id: user_id || null,
        model_used: modelUsed,
        explanation: text,
        difficulty_level: difficulty,
        cached: false,
        created_at: new Date().toISOString()
    };
}

async function askQuestion({ question, topic, user_name }) {
    const prompt = `
    ROL: Eres el Tutor IA de BateriaQ, un asistente experto en oposiciones.
    USUARIO: ${user_name || 'Estudiante'}
    CONTEXTO: El usuario está estudiando ${topic || 'temario general de oposiciones'} y tiene la siguiente duda.
    
    DUDA del alumno: "${question}"
    
    INSTRUCCIONES:
    1. Responde de forma clara, motivadora y pedagógica.
    2. Si es un concepto complejo, usa una analogía.
    3. Si la duda es sobre plazos o leyes, intenta ser preciso.
    4. Mantén la respuesta concisa pero completa (máximo 250 palabras).
    
    SÉ DIRECTO. No saludes. No digas "Claro, aquí tienes". Ve directo a la ayuda pedagógica.
    `.trim();

    const { text, modelUsed } = await callGeminiWithFallback(prompt);
    
    return {
        answer: text,
        model_used: modelUsed,
        created_at: new Date().toISOString()
    };
}

async function generateStudyStrategy({ plan, user_progress, days_to_exam }) {
    const prompt = `
    ROL: Eres el Estratega de Estudios de BateriaQ.
    
    CONTEXTO:
    - Plan de la semana: ${JSON.stringify(plan)}
    - Progreso actual: ${user_progress} temas registrados.
    - Días para examen: ${days_to_exam} (si es 30 es un valor estimado).
    
    TAREA:
    Analiza el plan y genera un consejo corto (max 60 palabras) que sea motivador y táctico. 
    Menciona algo específico sobre la carga de trabajo o la importancia de la constancia.
    
    ESTILO: Pedagógico, directo y estimulante.
    SÉ DIRECTO. No saludes.
    `.trim();

    const { text } = await callGeminiWithFallback(prompt);
    
    return {
        strategy: text,
        created_at: new Date().toISOString()
    };
}

module.exports = {
    generateExplanation,
    callGeminiWithFallback,
    askQuestion,
    generateStudyStrategy
};
