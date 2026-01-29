import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors';
import { HttpExceptionFilter } from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors();

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

bootstrap();
