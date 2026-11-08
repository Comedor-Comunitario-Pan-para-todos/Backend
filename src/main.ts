import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Activar validaciones globales para los DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos que no estén en el DTO
      forbidNonWhitelisted: true, // lanza error si envían campos no permitidos
      transform: true,
    }),
  );

  // 2. Configuración de Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('SIG-CCPT API - Comedor Comunitario Pan para Todos')
    .setDescription(
      'Documentación de la API del Sistema de Información y Gestión del Comedor Comunitario.',
    )
    .setVersion('1.0')
    .addBearerAuth() // Permite probar endpoints protegidos con token JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(` Servidor corriendo en http://localhost:${port}`);
  console.log(` Swagger disponible en http://localhost:${port}/api/docs`);
}
await bootstrap();