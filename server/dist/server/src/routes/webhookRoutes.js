"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscriptionService_1 = require("../services/subscriptionService");
const router = (0, express_1.Router)();
router.post('/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    try {
        const result = await subscriptionService_1.subscriptionService.handleWebhook(req.body, sig || '');
        return res.json({
            success: true,
            message: 'Webhook processed',
            data: result,
        });
    }
    catch (err) {
        console.error('Stripe webhook handling failed');
        return res.status(400).json({
            success: false,
            message: 'Webhook signature verification failed',
            errorCode: 'INVALID_SIGNATURE',
            data: null,
        });
    }
});
exports.default = router;
