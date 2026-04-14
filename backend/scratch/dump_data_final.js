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

    let sql = '-- DUMP FINAL COMPATIBLE CON SUPABASE\n';
    sql += 'ALTER TABLE "oppositions" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT \'General\';\n\n';

    users.forEach(u => {
      sql += `INSERT INTO "users" (id, name, email, password_hash, role) VALUES ('${u.id}', '${u.name}', '${u.email}', '${u.passwordHash}', '${u.role}') ON CONFLICT (id) DO NOTHING;\n`;
    });

    opos.forEach(o => {
      const desc = (o.description || '').replace(/'/g, "''");
      const icon = (o.icon || '').replace(/'/g, "''");
      const cat = (o.category || 'General').replace(/'/g, "''");
      sql += `INSERT INTO "oppositions" (id, name, description, icon, category) VALUES ('${o.id}', '${o.name.replace(/'/g, "''")}', '${desc}', '${icon}', '${cat}') ON CONFLICT (id) DO NOTHING;\n`;
    });

    topics.forEach(t => {
      const desc = (t.description || '').replace(/'/g, "''");
      const title = t.title.replace(/'/g, "''");
      sql += `INSERT INTO "topics" (id, title, description, icon, "order", color, opposition_id) VALUES ('${t.id}', '${title}', '${desc}', '${t.icon || ''}', ${t.order || 0}, '${t.color || '#6366f1'}', '${t.oppositionId}') ON CONFLICT (id) DO NOTHING;\n`;
    });

    subtopics.forEach(s => {
      const title = s.title.replace(/'/g, "''");
      const desc = (s.description || '').replace(/'/g, "''");
      sql += `INSERT INTO "subtopics" (id, title, description, topic_id) VALUES ('${s.id}', '${title}', '${desc}', '${s.topicId}') ON CONFLICT (id) DO NOTHING;\n`;
    });

    questions.forEach(q => {
      const escapedText = q.questionText.replace(/'/g, "''");
      const escapedExp = (q.explanation || '').replace(/'/g, "''");
      const subId = q.subtopicId ? `'${q.subtopicId}'` : 'NULL';
      sql += `INSERT INTO "questions" (id, question_text, options, correct_index, explanation, difficulty, topic_id, subtopic_id) VALUES ('${q.id}', '${escapedText}', '${JSON.stringify(q.options)}', ${q.correctIndex}, '${escapedExp}', '${q.difficulty}', '${q.topicId}', ${subId}) ON CONFLICT (id) DO NOTHING;\n`;
    });

    const outputPath = path.resolve('C:\\Users\\bacia\\.gemini\\antigravity\\brain\\a272643f-4924-4554-8710-45067a236cca\\backup_final_ok.sql');
    fs.writeFileSync(outputPath, sql);
    console.log('✅ Dump complete: ' + outputPath);
  } catch (err) {
    console.error('❌ Error during dump:', err);
  } finally {
    await prisma.$disconnect();
  }
}

dump();
