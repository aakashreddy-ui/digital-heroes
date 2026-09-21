"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const scoreRoutes_1 = __importDefault(require("./scoreRoutes"));
const charityRoutes_1 = __importDefault(require("./charityRoutes"));
const subscriptionRoutes_1 = __importDefault(require("./subscriptionRoutes"));
const drawRoutes_1 = __importDefault(require("./drawRoutes"));
const winnerRoutes_1 = __importDefault(require("./winnerRoutes"));
const donationRoutes_1 = __importDefault(require("./donationRoutes"));
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const analyticsRoutes_1 = __importDefault(require("./analyticsRoutes"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use('/auth', authRoutes_1.default);
router.get('/profile', auth_1.requireAuthentication, authController_1.authController.getMe);
router.put('/profile', auth_1.requireAuthentication, authController_1.authController.updateProfile);
router.use('/scores', scoreRoutes_1.default);
router.use('/charities', charityRoutes_1.default);
router.use('/subscription', subscriptionRoutes_1.default);
router.use('/draws', drawRoutes_1.default);
router.use('/winners', winnerRoutes_1.default);
router.use('/donations', donationRoutes_1.default);
router.use('/admin', adminRoutes_1.default);
router.use('/admin/analytics', analyticsRoutes_1.default);
// System health check
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
exports.default = router;
