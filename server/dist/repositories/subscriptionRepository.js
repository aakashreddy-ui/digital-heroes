"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRepository = void 0;
const db_1 = require("../db");
const uuid_1 = require("uuid");
exports.subscriptionRepository = {
    findByUserId(userId) {
        const row = db_1.db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId);
        if (!row)
            return null;
        return {
            id: row.id,
            user_id: row.user_id,
            plan_id: row.plan_id,
            status: row.status,
            stripe_customer_id: row.stripe_customer_id || undefined,
            stripe_subscription_id: row.stripe_subscription_id || undefined,
            current_period_start: row.current_period_start,
            current_period_end: row.current_period_end,
            cancel_at_period_end: Boolean(row.cancel_at_period_end),
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    },
    findByStripeSubscriptionId(stripeSubId) {
        const row = db_1.db.prepare('SELECT * FROM subscriptions WHERE stripe_subscription_id = ?').get(stripeSubId);
        if (!row)
            return null;
        return {
            id: row.id,
            user_id: row.user_id,
            plan_id: row.plan_id,
            status: row.status,
            stripe_customer_id: row.stripe_customer_id || undefined,
            stripe_subscription_id: row.stripe_subscription_id || undefined,
            current_period_start: row.current_period_start,
            current_period_end: row.current_period_end,
            cancel_at_period_end: Boolean(row.cancel_at_period_end),
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    },
    upsert(sub) {
        const existing = this.findByUserId(sub.userId);
        const now = new Date().toISOString();
        const periodStart = sub.currentPeriodStart || now;
        // Default 1 month or 1 year
        const endDate = new Date();
        if (sub.planId === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        const periodEnd = sub.currentPeriodEnd || endDate.toISOString();
        if (existing) {
            db_1.db.prepare(`
        UPDATE subscriptions
        SET plan_id = ?, status = ?, stripe_customer_id = COALESCE(?, stripe_customer_id),
            stripe_subscription_id = COALESCE(?, stripe_subscription_id),
            current_period_start = ?, current_period_end = ?, cancel_at_period_end = ?, updated_at = ?
        WHERE user_id = ?
      `).run(sub.planId, sub.status, sub.stripeCustomerId || null, sub.stripeSubscriptionId || null, periodStart, periodEnd, sub.cancelAtPeriodEnd ? 1 : 0, now, sub.userId);
        }
        else {
            const id = (0, uuid_1.v4)();
            db_1.db.prepare(`
        INSERT INTO subscriptions (id, user_id, plan_id, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, sub.userId, sub.planId, sub.status, sub.stripeCustomerId || null, sub.stripeSubscriptionId || null, periodStart, periodEnd, sub.cancelAtPeriodEnd ? 1 : 0, now, now);
        }
        return this.findByUserId(sub.userId);
    },
    updateStatus(userId, status, cancelAtPeriodEnd) {
        const now = new Date().toISOString();
        let query = `UPDATE subscriptions SET status = ?, updated_at = ?`;
        const params = [status, now];
        if (cancelAtPeriodEnd !== undefined) {
            query += `, cancel_at_period_end = ?`;
            params.push(cancelAtPeriodEnd ? 1 : 0);
        }
        query += ` WHERE user_id = ?`;
        params.push(userId);
        db_1.db.prepare(query).run(...params);
        return this.findByUserId(userId);
    },
    countActiveSubscribers() {
        const row = db_1.db.prepare(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'`).get();
        return row.count;
    },
    getAll(options) {
        let query = `
      SELECT s.*, p.email, p.full_name
      FROM subscriptions s
      JOIN profiles p ON s.user_id = p.id
      WHERE 1=1
    `;
        const params = [];
        if (options?.status) {
            query += ` AND s.status = ?`;
            params.push(options.status);
        }
        query += ` ORDER BY s.created_at DESC`;
        if (options?.limit) {
            query += ` LIMIT ? OFFSET ?`;
            params.push(options.limit, options.offset || 0);
        }
        return db_1.db.prepare(query).all(...params);
    },
};
