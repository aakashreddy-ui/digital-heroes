import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { authService } from '../src/services/authService';
import { subscriptionService } from '../src/services/subscriptionService';
import { Express } from 'express';

describe('Payments and Stripe webhook synchronization', () => {
  let app: Express;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    app = await createApp();
    const auth = await authService.signup({
      email: `pay_${Date.now()}@test.com`,
      password: 'Password123!',
      fullName: 'Payment Tester',
    });
    token = auth.token;
    userId = auth.user.id;
  });

  it('updates subscription status after activation and cancellation', async () => {
    const activated = subscriptionService.activateSubscription(userId, 'monthly');
    expect(activated.status).toBe('active');

    const cancelled = await subscriptionService.cancelSubscription(userId, true);
    expect(cancelled.status).toBe('cancelled');
  });

  it('accepts stripe webhook requests and returns a consistent envelope', async () => {
    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ type: 'ping' }));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.received).toBe(true);
  });

  it('creates a checkout session for authenticated users', async () => {
    const res = await request(app)
      .post('/api/subscription/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ plan_id: 'yearly' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.checkoutUrl).toBeTruthy();
  });
});
