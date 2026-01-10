import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Allow all for injection (or restrict to testing domain)
  });
  await app.listen(3000);
}
bootstrap();
