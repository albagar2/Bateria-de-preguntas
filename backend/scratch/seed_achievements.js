const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const achievements = [
    {
      code: 'FIRST_TEST',
      name: 'Primer Paso',
      description: 'Completa tu primer test en la plataforma.',
      icon: 'Award',
      type: 'VOLUME',
      threshold: 1
    },
    {
      code: 'TEN_TESTS',
      name: 'Entrenamiento Serio',
      description: 'Completa 10 tests.',
      icon: 'Target',
      type: 'VOLUME',
      threshold: 10
    },
    {
      code: 'PERFECT_SCORE',
      name: 'Perfeccionista',
      description: 'Consigue un 100% de aciertos en un test de al menos 20 preguntas.',
      icon: 'Zap',
      type: 'ACCURACY',
      threshold: 100
    },
    {
      code: 'STREAK_3',
      name: 'Racha Imparable',
      description: 'Mantén una racha de estudio de 3 días consecutivos.',
      icon: 'Flame',
      type: 'STREAK',
      threshold: 3
    }
  ];

  console.log('Seeding achievements...');
  
  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: ach,
      create: ach
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
