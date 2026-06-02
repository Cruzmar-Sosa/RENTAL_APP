import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { safeParsePolyline } from '../src/common/utils/geo';

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🔄 STARTING ROUTE DATABASE NORMALIZATION...');
  
  const routes = await prisma.route.findMany();
  console.log(`Found ${routes.length} routes in database.`);

  let normalizedCount = 0;
  let errorCount = 0;

  for (const route of routes) {
    console.log(`\n----------------------------------------`);
    console.log(`Route: "${route.name}" (ID: ${route.id})`);
    console.log(`Original Polyline Type: ${typeof route.polyline}`);
    console.log(`Original Polyline Content:`, JSON.stringify(route.polyline));

    try {
      const parsed = safeParsePolyline(route.polyline);
      console.log(`Normalized Polyline (Count: ${parsed.length}):`, JSON.stringify(parsed));

      // Update database record with standardized format
      await prisma.route.update({
        where: { id: route.id },
        data: {
          polyline: parsed as unknown as Prisma.InputJsonValue,
        },
      });

      console.log(`🟢 Successfully normalized route "${route.name}"`);
      normalizedCount++;
    } catch (err) {
      console.error(`🔴 Failed to normalize route "${route.name}":`, err);
      errorCount++;
    }
  }

  console.log(`\n----------------------------------------`);
  console.log(`🏁 NORMALIZATION COMPLETED.`);
  console.log(`Successfully Normalized: ${normalizedCount}`);
  console.log(`Errors Encountered: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error('Fatal error during database normalization:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
