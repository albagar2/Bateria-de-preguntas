const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const { generateExplanation, askQuestion, generateStudyStrategy, scanDocument } = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// -- Routes --

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'ai-microservice' });
});

// Endpoint: Generate an explanation for a question
app.post('/api/v1/generate-explanation', async (req, res) => {
    try {
        const { question_id, question_text, correct_answer, selected_answer, user_id, difficulty } = req.body;

        if (!question_text || !correct_answer) {
            return res.status(400).json({ error: 'Faltan parámetros obbligatorios (question_text o correct_answer)' });
        }

        const result = await generateExplanation({
            question_id,
            user_id,
            question_text,
            correct_answer,
            selected_answer,
            difficulty: difficulty || 'intermediate'
        });

        return res.json(result);
    } catch (error) {
        console.error('[AI Router Error]', error);
        return res.status(500).json({ error: 'Error inteno al generar la explicación con IA.' });
    }
});

// Endpoint: Chat / General Questions
app.post('/api/v1/ask', async (req, res) => {
    try {
        const { question, topic, user_name } = req.body;
        if (!question) return res.status(400).json({ error: 'Falta la pregunta' });

        const result = await askQuestion({ question, topic, user_name });
        return res.json(result);
    } catch (error) {
        console.error('[AI Chat Error]', error);
        return res.status(500).json({ error: 'Error interno en el chat de IA.' });
    }
});

// Endpoint: Study Plan Strategic Advice
app.post('/api/v1/study-strategy', async (req, res) => {
    try {
        const { plan, user_progress, days_to_exam } = req.body;
        const result = await generateStudyStrategy({ plan, user_progress, days_to_exam });
        return res.json({ advice: result.strategy });
    } catch (error) {
        console.error('[AI Strategy Error]', error);
        return res.status(500).json({ error: 'Error al generar la estrategia de estudio.' });
    }
});

// Endpoint: Scan Document (Multimodal)
app.post('/api/v1/scan-document', async (req, res) => {
    try {
        const { fileBase64, mimeType, topicHint } = req.body;
        if (!fileBase64) return res.status(400).json({ error: 'Falta el archivo en base64' });

        const questions = await scanDocument({ fileBase64, mimeType, topicHint });
        return res.json({ questions });
    } catch (error) {
        console.error('[AI Scan Error]', error);
        return res.status(500).json({ error: error.message || 'Error al escanear el documento.' });
    }
});

app.listen(PORT, () => {
    console.log(`🤖 AI Microservice running on http://localhost:${PORT}`);
});
