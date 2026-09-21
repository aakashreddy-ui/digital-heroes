import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController';
import { requireAuthentication } from '../middleware/auth';

const router = Router();

// Public plans list
router.get('/plans', subscriptionController.getPlans);

// Authenticated user subscription endpoints
router.get('/', requireAuthentication, subscriptionController.getCurrentSubscription);
router.post('/checkout', requireAuthentication, subscriptionController.createCheckout);
router.post('/cancel', requireAuthentication, subscriptionController.cancelSubscription);
router.post('/activate-test', requireAuthentication, subscriptionController.activateTestSubscription);

export default router;
