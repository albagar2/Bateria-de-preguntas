const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const opp1 = await prisma.opposition.create({
    data: { name: 'Celador', icon: '🏥' }
  });
  const opp2 = await prisma.opposition.create({
    data: { name: 'Profesor de Matemáticas', icon: '📐' }
  });
  const opp3 = await prisma.opposition.create({
    data: { name: 'Auxiliar Administrativo', icon: '💻' }
  });
  console.log('Oppositions seeded successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
