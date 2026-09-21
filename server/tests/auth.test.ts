import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { authService } from '../src/services/authService';
import { subscriptionService } from '../src/services/subscriptionService';
import { userRepository } from '../src/repositories/userRepository';
import { Express } from 'express';

describe('Role-Based Authorization & Subscription Verification', () => {
  let app: Express;
  let activeSubscriberToken: string;
  let inactiveSubscriberToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await createApp();

    // 1. Active subscriber
    const subAuth = await authService.signup({
      email: `active_sub_${Date.now()}@test.com`,
      password: 'Password123!',
      fullName: 'Active Sub Tester',
      role: 'subscriber',
    });
    activeSubscriberToken = subAuth.token;
    // Activate subscription
    subscriptionService.activateSubscription(subAuth.user.id, 'monthly');

    // 2. Inactive subscriber
    const inactiveAuth = await authService.signup({
      email: `inactive_sub_${Date.now()}@test.com`,
      password: 'Password123!',
      fullName: 'Inactive Sub Tester',
      role: 'subscriber',
    });
    inactiveSubscriberToken = inactiveAuth.token;
    // Leave without active subscription

    // 3. Admin
    const adminAuth = await authService.signup({
      email: `admin_sub_${Date.now()}@test.com`,
      password: 'AdminPassword123!',
      fullName: 'Admin Tester',
      role: 'admin',
    });
    adminToken = adminAuth.token;
  });

  it('blocks anonymous access to protected subscriber score APIs with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/scores');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('blocks inactive subscriber from accessing restricted subscriber score APIs with 403 Subscription Required', async () => {
    const res = await request(app)
      .get('/api/scores')
      .set('Authorization', `Bearer ${inactiveSubscriberToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('SUBSCRIPTION_REQUIRED');
  });

  it('permits active subscriber to access subscriber score APIs with 200 OK', async () => {
    const res = await request(app)
      .get('/api/scores')
      .set('Authorization', `Bearer ${activeSubscriberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('blocks regular subscriber from accessing admin APIs with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${activeSubscriberToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('FORBIDDEN');
  });

  it('permits administrator to access admin APIs with 200 OK', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users).toBeDefined();
  });
});
