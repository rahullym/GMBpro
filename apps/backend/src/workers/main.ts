import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  
  console.log('Background workers started');
  
  // Keep the application running
  process.on('SIGINT', async () => {
    console.log('Shutting down workers...');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('Error starting workers:', error);
  process.exit(1);
});

