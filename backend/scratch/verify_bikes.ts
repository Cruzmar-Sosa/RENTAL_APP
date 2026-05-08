import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const bikes = await prisma.bike.findMany();
  console.log('Bikes in DB:');
  console.table(bikes.map(b => ({
    id: b.id,
    model: b.model,
    status: b.status,
    operational: b.operationalStatus,
    technical: b.technicalStatus
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
