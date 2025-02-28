import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService)
  app.enableCors({
    origin: [configService.get("ORIGIN"), configService.get("ORIGIN_LOCAL")],
    credentials: true
  })
  app.use(cookieParser())
  await app.listen(configService.get('PORT') || 3001);
}
bootstrap();
