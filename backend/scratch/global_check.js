const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function globalCheck() {
  const questions = await prisma.question.findMany({
    include: { topic: { select: { title: true } } }
  });
  
  const textMap = new Map();
  const duplicates = [];
  
  for (const q of questions) {
    const text = q.questionText.trim().toLowerCase();
    if (textMap.has(text)) {
      duplicates.push({
        orig: textMap.get(text),
        dup: q
      });
    } else {
      textMap.set(text, q);
    }
  }
  
  if (duplicates.length > 0) {
    console.log(`¡Atención! Encontradas ${duplicates.length} preguntas con texto idéntico en el SISTEMA GLOBAL:`);
    duplicates.forEach((d, i) => {
      console.log(`${i+1}. "${d.dup.questionText.substring(0, 50)}..."`);
      console.log(`   - En Tema: ${d.orig.topic.title}`);
      console.log(`   - También en Tema: ${d.dup.topic.title}`);
    });
  } else {
    console.log('No hay ninguna pregunta repetida en toda la base de datos (ni en el mismo tema ni en temas distintos).');
  }
}

globalCheck()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
