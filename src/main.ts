import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './upload/upload.config';

async function bootstrap() {
  // Garantiza que la carpeta uploads exista al iniciar (por si se despliega en un servidor limpio)
  const uploadsPath = path.join(process.cwd(), UPLOADS_DIR);
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

}

bootstrap();
