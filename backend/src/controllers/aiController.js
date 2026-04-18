const aiService = require('../services/aiService');
const { ApiResponse } = require('../utils/ApiResponse');
const { prisma } = require('../config/database');

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
    const userId = req.user.id;
    
    console.log(`💬 Chat IA: Recibida pregunta de ${req.user.name}`);

    // 1. Guardar pregunta del usuario
    await prisma.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content: question
      }
    });

    // 2. Generar respuesta
    const result = await aiService.askQuestion({
      question,
      topic,
      name: req.user.name
    });

    // 3. Guardar respuesta de la IA
    await prisma.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: result.answer
      }
    });

    return ApiResponse.success(res, result);
  } catch (error) {
    console.error('❌ Error en Chat IA:', error);
    next(error);
  }
};

/**
 * Retrieves the chat history for the current user.
 */
exports.getChatHistory = async (req, res, next) => {
  try {
    const history = await prisma.chatMessage.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
      take: 50 // Limit to last 50 messages for performance
    });

    return ApiResponse.success(res, history);
  } catch (error) {
    next(error);
  }
};

/**
 * Scans a document (PDF/Image) and returns extracted questions.
 */
exports.scanDocument = async (req, res, next) => {
  try {
    const { fileBase64, mimeType, topicHint } = req.body;
    if (!fileBase64) return ApiResponse.error(res, 'No se ha proporcionado el archivo.', 400);

    const questions = await aiService.scanDocument({
      fileBase64,
      mimeType,
      topicHint
    });

    return ApiResponse.success(res, { questions });
  } catch (error) {
    console.error('❌ Error en Escaneo IA:', error);
    next(error);
  }
};


