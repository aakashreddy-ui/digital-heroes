import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { subscriptionService } from '../services/subscriptionService';
import { sendSuccess } from '../middleware/error';
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from '../../../shared/types';
import { checkoutSchema, validate } from '../validators';

export const subscriptionController = {
  getPlans(_req: any, res: Response) {
    return sendSuccess(res, SUBSCRIPTION_PLANS, 'Subscription plans');
  },

  getCurrentSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const sub = subscriptionService.getUserSubscription(userId);
      return sendSuccess(res, sub, 'Current subscription');
    } catch (err) {
      next(err);
    }
  },

  async createCheckout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { plan_id, success_url, cancel_url } = validate(checkoutSchema, req.body);
      const session = await subscriptionService.createCheckoutSession(
        userId,
        (plan_id as SubscriptionPlanId) || 'monthly',
        success_url,
        cancel_url
      );
      return sendSuccess(res, session, 'Checkout session created');
    } catch (err) {
      next(err);
    }
  },

  async cancelSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { immediate } = req.body;
      const sub = await subscriptionService.cancelSubscription(userId, Boolean(immediate));
      return sendSuccess(res, sub, 'Subscription cancelled');
    } catch (err) {
      next(err);
    }
  },

  // Test Mode instant activator for development / demo users
  activateTestSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ success: false, message: 'Not found', errorCode: 'NOT_FOUND', data: null });
      }
      const userId = req.user!.id;
      const { plan_id } = req.body;
      const sub = subscriptionService.activateSubscription(
        userId,
        (plan_id as SubscriptionPlanId) || 'monthly'
      );
      return sendSuccess(res, sub, 'Subscription activated successfully');
    } catch (err) {
      next(err);
    }
  }
};
