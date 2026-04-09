const { GoogleGenerativeAI } = require('@google/generative-ai');
const cache = require('../db/cache');

// Pool of models categorized by priority
const MODEL_POOL = [
    'gemini-2.5-pro',        // 1. High Quality 
    'gemini-2.5-flash',      // 2. Fast and cheaper fallback
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
            
            const model = genAI.getGenerativeModel({ model: modelName });
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
    Eres un tutor experto en oposiciones. 
    Pregunta: "${question_text}"
    Respuesta correcta: "${correct_answer}"
    ${selected_answer ? `El alumno respondió incorrectamente: "${selected_answer}"` : ''}
    
    Por favor, genera una explicación breve (máximo 4 líneas) de por qué la respuesta correcta es esa.
    ${toneInstruction}
    No repitas la pregunta, ve al grano.
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

module.exports = {
    generateExplanation,
    callGeminiWithFallback
};
