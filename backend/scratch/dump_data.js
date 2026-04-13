const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function dump() {
  try {
    const users = await prisma.user.findMany();
    const opos = await prisma.opposition.findMany();
    const topics = await prisma.topic.findMany();
    const subtopics = await prisma.subtopic.findMany();
    const questions = await prisma.question.findMany();

    let sql = '-- DUMP LOCAL DATA\n';

    users.forEach(u => {
      sql += `INSERT INTO "users" (id, name, email, password_hash, role) VALUES ('${u.id}', '${u.name}', '${u.email}', '${u.passwordHash}', '${u.role}');\n`;
    });

    opos.forEach(o => {
      sql += `INSERT INTO "oppositions" (id, name, description, icon) VALUES ('${o.id}', '${o.name}', '${o.description || ''}', '${o.icon || ''}');\n`;
    });

    topics.forEach(t => {
      sql += `INSERT INTO "topics" (id, title, description, icon, "order", color, opposition_id) VALUES ('${t.id}', '${t.title}', '${t.description || ''}', '${t.icon || ''}', ${t.order}, '${t.color}', '${t.oppositionId}');\n`;
    });

    subtopics.forEach(s => {
      sql += `INSERT INTO "subtopics" (id, title, description, topic_id) VALUES ('${s.id}', '${s.title}', '${s.description || ''}', '${s.topicId}');\n`;
    });

    questions.forEach(q => {
      const escapedText = q.questionText.replace(/'/g, "''");
      const escapedExplanation = (q.explanation || '').replace(/'/g, "''");
      const subId = q.subtopicId ? `'${q.subtopicId}'` : 'NULL';
      sql += `INSERT INTO "questions" (id, question_text, options, correct_index, explanation, difficulty, topic_id, subtopic_id) VALUES ('${q.id}', '${escapedText}', '${JSON.stringify(q.options)}', ${q.correctIndex}, '${escapedExplanation}', '${q.difficulty}', '${q.topicId}', ${subId});\n`;
    });

    const outputPath = path.resolve('C:\\Users\\bacia\\.gemini\\antigravity\\brain\\a272643f-4924-4554-8710-45067a236cca\\backup_datos_local.sql');
    fs.writeFileSync(outputPath, sql);
    console.log('✅ Dump complete: ' + outputPath);
  } catch (err) {
    console.error('❌ Error during dump:', err);
  } finally {
    await prisma.$disconnect();
  }
}

dump();
