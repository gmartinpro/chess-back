import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: 'GET,POST',
    credentials: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app)); // TODO: explain
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  Logger.log(`🚀 Server running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
