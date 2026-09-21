"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const fs_1 = __importDefault(require("fs"));
const routes_1 = __importDefault(require("./routes"));
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
const error_1 = require("./middleware/error");
const db_1 = require("./db");
const config_1 = require("./config");
const rateLimit_1 = require("./middleware/rateLimit");
const seedData_1 = require("./seeds/seedData");
async function createApp() {
    (0, config_1.validateProductionConfig)();
    const app = (0, express_1.default)();
    // Initialize DB tables and seed plans
    await (0, db_1.initDatabase)();
    if (process.env.NODE_ENV !== 'test') {
        const profileCount = db_1.db.prepare('SELECT COUNT(*) as c FROM profiles').get().c;
        if (!profileCount) {
            await (0, seedData_1.seed)();
        }
    }
    // Ensure uploads directory exists
    if (!fs_1.default.existsSync(config_1.config.uploadDir)) {
        fs_1.default.mkdirSync(config_1.config.uploadDir, { recursive: true });
    }
    // Security headers & CORS
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use((0, cors_1.default)({
        origin: [config_1.config.clientUrl, 'http://localhost:3000', 'http://localhost:5173'].filter(Boolean),
        credentials: true,
    }));
    app.use((0, rateLimit_1.rateLimit)({ windowMs: 60_000, max: 180 }));
    // Stripe webhook raw parser (must precede express.json)
    app.use('/api/webhooks', express_1.default.raw({ type: 'application/json' }), webhookRoutes_1.default);
    // Standard body parsers
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Static uploads serving
    app.use('/uploads', express_1.default.static(config_1.config.uploadDir));
    // Mount API
    app.use('/api', routes_1.default);
    // Centralized Error Handler
    app.use(error_1.errorHandler);
    return app;
}
