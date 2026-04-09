const { ApiResponse } = require('../utils/ApiResponse');

exports.generateExplanation = async (req, res, next) => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:4001/api/v1';
    const { question_id, question_text, correct_answer, selected_answer, difficulty } = req.body;
    
    console.log(`📡 Solicitando explicación IA para pregunta: ${question_id}`);

    const response = await fetch(`${aiServiceUrl}/generate-explanation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id,
        question_text,
        correct_answer,
        selected_answer,
        user_id: req.user.id,
        difficulty: difficulty || 'intermediate'
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Error del microservicio IA:', errText);
      return res.status(response.status).json({ success: false, message: 'La IA no pudo procesar la solicitud.', details: errText });
    }

    const data = await response.json();
    return ApiResponse.success(res, data.data || data);
  } catch (error) {
    console.error('❌ Error al contactar con el AI microservice:', error);
    next(error);
  }
};

exports.askQuestion = async (req, res, next) => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:4001/api/v1';
    const { question, topic } = req.body;
    
    console.log(`💬 Chat IA: Recibida pregunta de ${req.user.name}`);

    const response = await fetch(`${aiServiceUrl}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        topic,
        user_name: req.user.name
      })
    });

    if (!response.ok) {
        throw new Error('El microservicio de IA no respondió correctamente');
    }

    const data = await response.json();
    return ApiResponse.success(res, data);
  } catch (error) {
    console.error('❌ Error en Chat IA:', error);
    next(error);
  }
};


