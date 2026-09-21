import { Router, Request, Response } from 'express';
import { subscriptionService } from '../services/subscriptionService';

const router = Router();

router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  try {
    const result = await subscriptionService.handleWebhook(req.body, sig || '');
    return res.json({
      success: true,
      message: 'Webhook processed',
      data: result,
    });
  } catch (err: any) {
    console.error('Stripe webhook handling failed');
    return res.status(400).json({
      success: false,
      message: 'Webhook signature verification failed',
      errorCode: 'INVALID_SIGNATURE',
      data: null,
    });
  }
});

export default router;
