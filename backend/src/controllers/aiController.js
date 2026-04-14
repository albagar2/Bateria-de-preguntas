const aiService = require('../services/aiService');
const { ApiResponse } = require('../utils/ApiResponse');

/**
 * Generates an explanation for a question using integrated Gemini AI.
 * Now uses local service instead of external microservice.
 */
exports.generateExplanation = async (req, res, next) => {
  try {
    const { questionId, questionText, correctAnswer, selectedAnswer, difficulty } = req.body;
    
    console.log(`📡 Generando explicación IA (local) para: ${questionId}`);

    const result = await aiService.generateExplanation({
      questionId,
      questionText,
      correctAnswer,
      selectedAnswer,
      difficulty: difficulty || 'MEDIUM'
    });

    return ApiResponse.success(res, result);
  } catch (error) {
    console.error('❌ Error en Generación IA:', error);
    next(error);
  }
};

/**
 * Handles general chat questions using integrated Gemini AI.
 */
exports.askQuestion = async (req, res, next) => {
  try {
    const { question, topic } = req.body;
    
    console.log(`💬 Chat IA: Recibida pregunta de ${req.user.name}`);

    const result = await aiService.askQuestion({
      question,
      topic,
      name: req.user.name
    });

    return ApiResponse.success(res, result);
  } catch (error) {
    console.error('❌ Error en Chat IA:', error);
    next(error);
  }
};


