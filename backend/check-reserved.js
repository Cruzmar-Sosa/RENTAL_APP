const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reserved = await prisma.bike.findMany({ where: { status: 'RESERVED' } });
  console.log('RESERVED bikes found:', reserved.length);
  reserved.forEach(b => console.log('  id:', b.id, 'code:', b.code));

  if (reserved.length > 0) {
    const result = await prisma.bike.updateMany({
      where: { status: 'RESERVED' },
      data: { status: 'AVAILABLE' }
    });
    console.log('Migrated to AVAILABLE:', result.count, 'bikes');
  } else {
    console.log('Safe to proceed. No RESERVED bikes in DB.');
  }
}

main().catch(e => console.error(e.message)).finally(() => prisma.$disconnect());
