import 'dotenv/config';
import { PrismaService } from './src/prisma/prisma.service';

async function bootstrap() {
  try {
    const prisma = new PrismaService();
    await prisma.onModuleInit();
    console.log('Fetching user...');
    const user = await prisma.user.findFirst();
    console.log('Success:', user !== null);
  } catch (e) {
    console.error('Prisma Error Details:', e);
  }
}
bootstrap();
