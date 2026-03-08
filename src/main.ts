import './instrument';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SentryFilter } from './common/filters/sentry.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  
  // Enable CORS with restricted origins
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3002',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Sentry global error tracking
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryFilter(httpAdapter));
  
  // Global prefix for API routes with webhook exclusions
  app.setGlobalPrefix('api', {
    exclude: [
      'payments/paystack/webhook',
      'payments/paddle/webhook',
      'payments/polar/webhook',
    ],
  });
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 BandReady API running smoooooothly on http://localhost:${port}`);
}
bootstrap();
