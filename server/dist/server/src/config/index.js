"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateProductionConfig = validateProductionConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
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
    uploadDir: path_1.default.resolve(__dirname, '../../uploads'),
};
function validateProductionConfig() {
    if (exports.config.nodeEnv !== 'production')
        return;
    const missing = [
        ['JWT_SECRET', exports.config.jwtSecret === 'development-only-jwt-secret'],
        ['DATABASE_URL or Supabase adapter', !exports.config.databaseUrl && !exports.config.supabaseServiceRoleKey],
        ['STRIPE_SECRET_KEY', !exports.config.stripeSecretKey],
        ['STRIPE_WEBHOOK_SECRET', !exports.config.stripeWebhookSecret],
        ['STRIPE_MONTHLY_PRICE_ID', !exports.config.stripeMonthlyPriceId],
        ['STRIPE_YEARLY_PRICE_ID', !exports.config.stripeYearlyPriceId],
    ].filter(([, isMissing]) => isMissing).map(([name]) => name);
    if (missing.length > 0) {
        throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
    }
}
