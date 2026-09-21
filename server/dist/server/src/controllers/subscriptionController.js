"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionController = void 0;
const subscriptionService_1 = require("../services/subscriptionService");
const error_1 = require("../middleware/error");
const types_1 = require("../../../shared/types");
const validators_1 = require("../validators");
exports.subscriptionController = {
    getPlans(_req, res) {
        return (0, error_1.sendSuccess)(res, types_1.SUBSCRIPTION_PLANS, 'Subscription plans');
    },
    getCurrentSubscription(req, res, next) {
        try {
            const userId = req.user.id;
            const sub = subscriptionService_1.subscriptionService.getUserSubscription(userId);
            return (0, error_1.sendSuccess)(res, sub, 'Current subscription');
        }
        catch (err) {
            next(err);
        }
    },
    async createCheckout(req, res, next) {
        try {
            const userId = req.user.id;
            const { plan_id, success_url, cancel_url } = (0, validators_1.validate)(validators_1.checkoutSchema, req.body);
            const session = await subscriptionService_1.subscriptionService.createCheckoutSession(userId, plan_id || 'monthly', success_url, cancel_url);
            return (0, error_1.sendSuccess)(res, session, 'Checkout session created');
        }
        catch (err) {
            next(err);
        }
    },
    async cancelSubscription(req, res, next) {
        try {
            const userId = req.user.id;
            const { immediate } = req.body;
            const sub = await subscriptionService_1.subscriptionService.cancelSubscription(userId, Boolean(immediate));
            return (0, error_1.sendSuccess)(res, sub, 'Subscription cancelled');
        }
        catch (err) {
            next(err);
        }
    },
    // Test Mode instant activator for development / demo users
    activateTestSubscription(req, res, next) {
        try {
            if (process.env.NODE_ENV === 'production') {
                return res.status(404).json({ success: false, message: 'Not found', errorCode: 'NOT_FOUND', data: null });
            }
            const userId = req.user.id;
            const { plan_id } = req.body;
            const sub = subscriptionService_1.subscriptionService.activateSubscription(userId, plan_id || 'monthly');
            return (0, error_1.sendSuccess)(res, sub, 'Subscription activated successfully');
        }
        catch (err) {
            next(err);
        }
    }
};
