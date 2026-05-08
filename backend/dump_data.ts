import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

async function dump() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No connection string found');
    return;
  }

  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  const adapter = new PrismaPg(pool as any);
  const prisma = new PrismaClient({ adapter });
  
  const dumpDir = path.join(process.cwd(), 'db_dump');
  
  if (!fs.existsSync(dumpDir)) {
    fs.mkdirSync(dumpDir);
  }

  const models = [
    'User', 'Station', 'Bike', 'Reservation', 'Payment', 'Permission', 
    'RolePermission', 'UserPermission', 'Route', 'POI', 'BikeLocation'
  ];

  for (const model of models) {
    try {
      console.log(`Dumping ${model}...`);
      const data = await (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)].findMany();
      fs.writeFileSync(path.join(dumpDir, `${model}.json`), JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`Failed to dump ${model}:`, e);
    }
  }

  await prisma.$disconnect();
}

dump();
