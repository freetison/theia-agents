import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const port = parseInt(process.env['PORT'] ?? '3000', 10);

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  const config = new DocumentBuilder()
    .setTitle('Theia Agents API')
    .setDescription('HTTP/SSE API for the Theia multi-agent engine')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Tenant-Id' }, 'tenantId')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal bootstrap error:', err);
  process.exitCode = 1;
});
