import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { join } from 'path';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors';
import { HttpExceptionFilter } from './common/filters';

export function validateEnv(): void {
  const required = [
    'DATABASE_URL',
    'FRONTEND_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

async function bootstrap() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Enable raw body for Stripe webhooks
  });
  const logger = new Logger('Bootstrap');

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable CORS with explicit configuration
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('The Code of Life API')
    .setDescription(
      'API for the interactive puzzle game based on "The Code of Life" book. ' +
        'Handles puzzle management, user progress, and symbol decoding. ' +
        'All request validation is powered by Zod schemas.',
    )
    .setVersion('1.0')
    .addTag('puzzles', 'Puzzle management and retrieval')
    .addTag('decoder', 'Symbol encoding/decoding operations')
    .addTag('billing', 'Subscription and billing management')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const cleanedDocument = cleanupOpenApiDoc(document);
  SwaggerModule.setup('api/docs', app, cleanedDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}/api`);
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

if (require.main === module) {
  validateEnv();
  void bootstrap();
}
