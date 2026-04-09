exports.generateExplanation = async (req, res, next) => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:4001/api/v1';
    
    // We expect the body to have the necessary context. 
    // In a more secure app, we'd fetch the question from DB to ensure text/correct_answer are truthful.
    const { question_id, question_text, correct_answer, selected_answer, difficulty } = req.body;
    
    console.log(`Solicitando explicación IA para pregunta: ${question_id}`);

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
      console.error('Error del microservicio IA:', errText);
      return res.status(response.status).json({ success: false, message: 'La IA no pudo procesar la solicitud.', details: errText });
    }

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error al contactar con el AI microservice:', error);
    next(error);
  }
};
