import 'dotenv/config';
// Allow Supabase self-signed certificates (needed for @prisma/adapter-pg + Supabase)
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'https://rental-app-xi-six.vercel.app',
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
