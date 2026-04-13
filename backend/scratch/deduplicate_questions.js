const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deduplicate() {
  console.log('--- Iniciando Desduplicación de Preguntas ---');
  
  // 1. Obtener todas las preguntas
  const questions = await prisma.question.findMany({
    select: {
      id: true,
      questionText: true,
      topicId: true
    }
  });
  
  const seen = new Set();
  const toDelete = [];
  
  for (const q of questions) {
    // Definimos la clave de duplicado: mismo tema + mismo texto (normalizado)
    const key = `${q.topicId}_${q.questionText.trim().toLowerCase()}`;
    
    if (seen.has(key)) {
      toDelete.push(q.id);
    } else {
      seen.add(key);
    }
  }
  
  console.log(`Encontradas ${toDelete.length} preguntas duplicadas de un total de ${questions.length}.`);
  
  if (toDelete.length > 0) {
    const result = await prisma.question.deleteMany({
      where: {
        id: { in: toDelete }
      }
    });
    console.log(`Se han eliminado ${result.count} preguntas con éxito.`);
  } else {
    console.log('No se encontraron duplicados.');
  }
}

deduplicate()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
