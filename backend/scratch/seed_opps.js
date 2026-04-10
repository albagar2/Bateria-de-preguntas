const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding oppositions...');
  
  const opp1 = await prisma.opposition.upsert({
    where: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
    update: {},
    create: {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'Administrativo del Estado',
      description: 'Cuerpo General Administrativo de la Administración del Estado',
      icon: '🏛️'
    }
  });

  const opp2 = await prisma.opposition.upsert({
    where: { id: 'b2c3d4e5-f6a7-8901-bcde-f1234567890a' },
    update: {},
    create: {
      id: 'b2c3d4e5-f6a7-8901-bcde-f1234567890a',
      name: 'Auxiliar Administrativo',
      description: 'Cuerpo Auxiliar de la Administración General del Estado',
      icon: '📝'
    }
  });

  console.log('Oppositions seeded:', [opp1.name, opp2.name]);

  // Link existing topics to the first opposition as an example
  const topics = await prisma.topic.findMany({ where: { oppositionId: null } });
  if (topics.length > 0) {
    console.log(`Linking ${topics.length} topics to ${opp1.name}...`);
    await prisma.topic.updateMany({
      where: { id: { in: topics.map(t => t.id) } },
      data: { oppositionId: opp1.id }
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
