import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Polyfill for crypto.randomUUID in Node < 19
if (!global.crypto) {
  global.crypto = require('crypto');
}
if (!global.crypto.randomUUID) {
  const { randomUUID } = require('crypto');
  global.crypto.randomUUID = randomUUID;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:43220', 
      'http://localhost:3001',
      'https://city-charge-web.vercel.app'
    ], // Allow both frontend ports and production URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('EV Charging Platform API')
    .setDescription('API documentation for the EV Charging Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 43219);
}
bootstrap();
