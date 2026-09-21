import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import routes from './routes';
import webhookRoutes from './routes/webhookRoutes';
import { errorHandler } from './middleware/error';
import { initDatabase, db } from './db';
import { config, validateProductionConfig } from './config';
import { rateLimit } from './middleware/rateLimit';
import { seed } from './seeds/seedData';

export async function createApp() {
  validateProductionConfig();
  const app = express();

  // Initialize DB tables and seed plans
  await initDatabase();

  if (process.env.NODE_ENV !== 'test') {
    const profileCount = (db.prepare('SELECT COUNT(*) as c FROM profiles').get() as { c: number }).c;
    if (!profileCount) {
      await seed();
    }
  }

  // Ensure uploads directory exists
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }

  // Security headers & CORS
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(cors({
    origin: [config.clientUrl, 'http://localhost:3000', 'http://localhost:5173'].filter(Boolean),
    credentials: true,
  }));

  app.use(rateLimit({ windowMs: 60_000, max: 180 }));

  // Stripe webhook raw parser (must precede express.json)
  app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

  // Standard body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads serving
  app.use('/uploads', express.static(config.uploadDir));

  // Mount API
  app.use('/api', routes);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
