import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

// If no MONGO_URL is provided, start an in-memory MongoDB and populate it with
// the seed data so the app boots with usable content. Lets us deploy on
// Railway without provisioning a Mongo plugin. Data evaporates on restart.
async function ensureMongoUrl(): Promise<void> {
  if (process.env.MONGO_URL) return;
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  // Pin to a Mongo 7 binary — Debian 12 (node:20-slim) doesn't have older
  // mongodb binaries available, and the default in mongodb-memory-server@9
  // is 6.0.14 which fails to download there.
  const server = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
  process.env.MONGO_URL = server.getUri();
  console.log(`[api] using in-memory MongoDB at ${server.getUri()}`);

  const { runSeed } = await import('./seed/seed');
  await runSeed(server.getUri());
  console.log('[api] in-memory MongoDB seeded');
}

async function bootstrap(): Promise<void> {
  await ensureMongoUrl();
  const app: INestApplication = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger UI at /api/docs (raw JSON at /api/docs-json). Sits behind the
  // session-cookie auth boundary in UI, but the docs page itself is reachable
  // without login because SwaggerModule mounts via plain Express middleware
  // — the global JwtAuthGuard doesn't intercept it.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mashov API')
    .setDescription('Family dashboard API — auth via the `mashov_session` cookie')
    .setVersion('0.2.0')
    .addCookieAuth('mashov_session')
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDoc, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://0.0.0.0:${port}/api`);
}

void bootstrap();
