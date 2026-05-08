import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// Prisma v7 requires adapter-pg (same pattern as PrismaService)
const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);


const MODULES = ['BIKES', 'USERS', 'STATIONS', 'RESERVATIONS', 'SETTINGS', 'TRACKING', 'PAYMENTS', 'ROUTES'];
const ACTIONS = ['PAGE', 'CREATE', 'READ', 'UPDATE', 'DELETE'];

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // ─────────────────────────────────────────────
  // 1. Seed Permissions (UPSERT — safe to re-run)
  // ─────────────────────────────────────────────
  console.log('🔐 Seeding Permissions...');
  const allPermissions: any[] = [];

  for (const module of MODULES) {
    for (const action of ACTIONS) {
      const p = await prisma.permission.upsert({
        where: { module_action: { module, action } } as any,
        update: {},
        create: {
          module,
          action,
          type: action === 'PAGE' ? 'PAGE' : 'ACTION'
        }
      });
      allPermissions.push(p);
    }
  }

  // ─────────────────────────────────────────────
  // 2. Seed Role Permissions (ADMIN = all)
  // ─────────────────────────────────────────────
  console.log('👑 Seeding ADMIN RolePermissions...');
  for (const p of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { role_permissionId: { role: 'ADMIN', permissionId: p.id } },
      update: {},
      create: { role: 'ADMIN', permissionId: p.id }
    });
  }

  // USER gets limited defaults
  const userAllowed = [
    { module: 'STATIONS', action: 'PAGE' },
    { module: 'RESERVATIONS', action: 'PAGE' },
    { module: 'RESERVATIONS', action: 'CREATE' },
    { module: 'PAYMENTS', action: 'PAGE' },
    { module: 'PAYMENTS', action: 'READ' },
    { module: 'ROUTES', action: 'PAGE' },
    { module: 'ROUTES', action: 'READ' },
  ];

  console.log('👤 Seeding USER RolePermissions...');
  const userPerms = allPermissions.filter(p =>
    userAllowed.some(ua => ua.module === p.module && ua.action === p.action)
  );

  for (const p of userPerms) {
    await prisma.rolePermission.upsert({
      where: { role_permissionId: { role: 'USER', permissionId: p.id } },
      update: {},
      create: { role: 'USER', permissionId: p.id }
    });
  }

  // ─────────────────────────────────────────────
  // 3. Admin User
  // ─────────────────────────────────────────────
  console.log('🧑‍💼 Seeding Users...');
  await prisma.user.upsert({
    where: { email: 'admin@etours.com' },
    update: {},
    create: {
      email: 'admin@etours.com',
      password,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@etours.com' },
    update: {},
    create: {
      email: 'user@etours.com',
      password,
      name: 'Test User',
      role: 'USER',
    },
  });

  // ─────────────────────────────────────────────
  // 4. Station + Bikes (create only if none exist)
  // ─────────────────────────────────────────────
  const existingStation = await prisma.station.findFirst({
    where: { name: 'León Central Park' }
  });

  if (!existingStation) {
    console.log('🏪 Seeding Station & Bikes...');
    await prisma.station.create({
      data: {
        name: 'León Central Park',
        latitude: 21.1236,
        longitude: -101.6825,
        address: 'Frente a la Catedral de León, Gto.',
        capacity: 10,
        bikes: {
          create: [
            { model: 'eTours Pro', status: 'AVAILABLE', operationalStatus: 'AVAILABLE', technicalStatus: 'OK', batteryLevel: 95 },
            { model: 'eTours Pro', status: 'AVAILABLE', operationalStatus: 'AVAILABLE', technicalStatus: 'OK', batteryLevel: 88 },
            { model: 'eTours City', status: 'AVAILABLE', operationalStatus: 'AVAILABLE', technicalStatus: 'OK', batteryLevel: 72 },
            { model: 'eTours City', status: 'AVAILABLE', operationalStatus: 'AVAILABLE', technicalStatus: 'MAINTENANCE', batteryLevel: 15 },
          ]
        }
      }
    });
  } else {
    console.log('🏪 Station already exists, skipping...');
  }

  // ─────────────────────────────────────────────
  // 5. Routes (create only if none exist)
  // ─────────────────────────────────────────────
  const existingRoute = await prisma.route.findFirst();
  if (!existingRoute) {
    console.log('🗺️ Seeding Routes...');
    await prisma.route.create({
      data: {
        name: 'Centro Histórico Tour',
        description: 'Recorre los monumentos históricos del Centro de León a bordo de una bici eléctrica.',
        difficulty: 'EASY',
        distanceKm: 6.5,
        durationMin: 45,
        polyline: JSON.stringify([
          { lat: 21.1239, lng: -101.6832 },
          { lat: 21.1210, lng: -101.6811 },
          { lat: 21.1182, lng: -101.6793 },
          { lat: 21.1178, lng: -101.6790 }
        ]),
        pois: {
          create: [
            { name: 'Catedral de León', description: 'Punto de partida', latitude: 21.1239, longitude: -101.6832 },
            { name: 'Jardín Unión', description: 'Corazón de la ciudad', latitude: 21.1182, longitude: -101.6793 },
            { name: 'Teatro Juárez', description: 'Icono arquitectónico', latitude: 21.1178, longitude: -101.6790 },
          ]
        }
      }
    });

    await prisma.route.create({
      data: {
        name: 'Parque Ecológico Metropolitano',
        description: 'Ruta natural entre áreas verdes con miradores y senderos.',
        difficulty: 'MODERATE',
        distanceKm: 12.2,
        durationMin: 75,
        polyline: JSON.stringify([
          { lat: 21.1712, lng: -101.6853 },
          { lat: 21.1725, lng: -101.6865 },
          { lat: 21.1740, lng: -101.6850 },
        ]),
      }
    });
  } else {
    console.log('🗺️ Routes already exist, skipping...');
  }

  console.log('\n✅ Seed completed successfully!\n');
  console.log('   Credentials:');
  console.log('   admin@etours.com / password123');
  console.log('   user@etours.com  / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
