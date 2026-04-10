const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const oppositions = await prisma.opposition.findMany();
  console.log('Oppositions:', JSON.stringify(oppositions, null, 2));
  
  const topics = await prisma.topic.findMany();
  console.log('Topics sample:', JSON.stringify(topics.slice(0, 5), null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
