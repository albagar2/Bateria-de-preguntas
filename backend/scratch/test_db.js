
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing DB connection...');
    const userCount = await prisma.user.count();
    console.log(`Connection successful. User count: ${userCount}`);
    
    // Check for a specific user to see if query fails
    const user = await prisma.user.findFirst();
    console.log('First user found:', user?.email);
    
    process.exit(0);
  } catch (error) {
    console.error('DB Connection Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
