import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Helmet Security Headers with Tailored Next.js / Leaflet / Socket.IO CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://unpkg.com',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https://*.supabase.co',
            'https://*.tile.openstreetmap.org',
            'https://unpkg.com',
          ],
          connectSrc: [
            "'self'",
            'https://*.supabase.co',
            'wss:',
            'ws:',
            'http:',
            'https:',
          ],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // 2. Body Payload Limits (JSON and urlencoded)
  const maxBodySize = process.env.MAX_JSON_BODY_SIZE || '1mb';
  app.use(express.json({ limit: maxBodySize }));
  app.use(express.urlencoded({ limit: maxBodySize, extended: true }));

  // 3. Strict & Hardened CORS
  const allowedOrigins: (string | RegExp)[] = [
    'https://rental-app-xi-six.vercel.app',
  ];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 4. Global Input Validation & DTO Transformation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
