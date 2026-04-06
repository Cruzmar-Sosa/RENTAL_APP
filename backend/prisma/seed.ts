import { PrismaService } from '../src/prisma/prisma.service';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaService();

async function main() {
  await prisma.onModuleInit();
  const password = await bcrypt.hash('password123', 10);
  
  // 1. Seed Permissions
  const MODULES = ['BIKES', 'USERS', 'STATIONS', 'RESERVATIONS', 'SETTINGS'];
  const ACTIONS = ['PAGE', 'CREATE', 'READ', 'UPDATE', 'DELETE'];
  
  console.log('Seeding Permissions...');
  const allPermissions = [];
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      const p = await prisma.permission.create({
        data: { module, action, type: action === 'PAGE' ? 'PAGE' : 'ACTION' }
      });
      allPermissions.push(p);
    }
  }

  // 2. Seed RolePermissions
  console.log('Seeding RolePermissions...');
  // ADMIN gets everything
  await prisma.rolePermission.createMany({
    data: allPermissions.map(p => ({
      role: 'ADMIN',
      permissionId: p.id
    }))
  });

  // USER gets limited defaults
  const userAllowed = [
    { module: 'STATIONS', action: 'PAGE' }, // See dashboard
    { module: 'RESERVATIONS', action: 'PAGE' }, // See personal reservations route
    { module: 'RESERVATIONS', action: 'CREATE' }, // Can rent a bike
  ];
  
  const userPerms = allPermissions.filter(p => 
    userAllowed.some(ua => ua.module === p.module && ua.action === p.action)
  );

  await prisma.rolePermission.createMany({
    data: userPerms.map(p => ({
      role: 'USER',
      permissionId: p.id
    }))
  });

  // 3. Admin & User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@etours.com' },
    update: {},
    create: {
      email: 'admin@etours.com',
      password,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Regular User
  const user = await prisma.user.upsert({
    where: { email: 'user@etours.com' },
    update: {},
    create: {
      email: 'user@etours.com',
      password,
      name: 'Test User',
    },
  });

  // Station
  const station = await prisma.station.create({
    data: {
      name: 'León Central Park',
      latitude: 12.4350,
      longitude: -86.8780,
      address: 'Frente a la Catedral de León',
      bikes: {
        create: [
          { status: 'AVAILABLE' },
          { status: 'AVAILABLE' },
          { status: 'AVAILABLE' },
        ]
      }
    }
  });
  
  console.log('Seeding finished. Added Permissions, Role Defaults, Admin, User, and 1 Station with 3 Bikes.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
