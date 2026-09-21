import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  stripeSimulatorEnabled: process.env.STRIPE_SIMULATOR_ENABLED === 'true' || (process.env.NODE_ENV || 'development') !== 'production',
  jwtSecret: process.env.JWT_SECRET || 'development-only-jwt-secret',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5001/api',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripeMonthlyPriceId: process.env.STRIPE_MONTHLY_PRICE_ID || '',
  stripeYearlyPriceId: process.env.STRIPE_YEARLY_PRICE_ID || '',
  payoutProvider: process.env.PAYOUT_PROVIDER || 'manual',
  payoutApiKey: process.env.PAYOUT_API_KEY || '',

  // Uploads
  uploadDir: path.resolve(__dirname, '../../uploads'),
};

export function validateProductionConfig() {
  if (config.nodeEnv !== 'production') return;

  const missing = [
    ['JWT_SECRET', config.jwtSecret === 'development-only-jwt-secret'],
    ['DATABASE_URL or Supabase adapter', !config.databaseUrl && !config.supabaseServiceRoleKey],
    ['STRIPE_SECRET_KEY', !config.stripeSecretKey],
    ['STRIPE_WEBHOOK_SECRET', !config.stripeWebhookSecret],
    ['STRIPE_MONTHLY_PRICE_ID', !config.stripeMonthlyPriceId],
    ['STRIPE_YEARLY_PRICE_ID', !config.stripeYearlyPriceId],
  ].filter(([, isMissing]) => isMissing).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
  }
}
