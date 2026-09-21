"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscriptionController_1 = require("../controllers/subscriptionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public plans list
router.get('/plans', subscriptionController_1.subscriptionController.getPlans);
// Authenticated user subscription endpoints
router.get('/', auth_1.requireAuthentication, subscriptionController_1.subscriptionController.getCurrentSubscription);
router.post('/checkout', auth_1.requireAuthentication, subscriptionController_1.subscriptionController.createCheckout);
router.post('/cancel', auth_1.requireAuthentication, subscriptionController_1.subscriptionController.cancelSubscription);
router.post('/activate-test', auth_1.requireAuthentication, subscriptionController_1.subscriptionController.activateTestSubscription);
exports.default = router;
