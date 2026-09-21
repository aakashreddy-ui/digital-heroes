"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.donationRepository = void 0;
const db_1 = require("../db");
const uuid_1 = require("uuid");
exports.donationRepository = {
    create(data) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        db_1.db.prepare(`
      INSERT INTO donations (id, user_id, donor_name, donor_email, charity_id, amount_cents, frequency, stripe_payment_intent_id, status, is_independent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, data.userId || null, data.donorName || null, data.donorEmail || null, data.charityId, data.amountCents, data.frequency || 'one_off', data.stripePaymentIntentId || null, data.status || 'succeeded', now);
        return this.getById(id);
    },
    getById(id) {
        const row = db_1.db.prepare(`
      SELECT d.*, c.name as charity_name
      FROM donations d
      JOIN charities c ON d.charity_id = c.id
      WHERE d.id = ?
    `).get(id);
        if (!row)
            return null;
        return this.mapRowToDonation(row);
    },
    getByUserId(userId) {
        const rows = db_1.db.prepare(`
      SELECT d.*, c.name as charity_name
      FROM donations d
      JOIN charities c ON d.charity_id = c.id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
    `).all(userId);
        return rows.map(this.mapRowToDonation);
    },
    getByCharityId(charityId) {
        const rows = db_1.db.prepare(`
      SELECT d.*, c.name as charity_name
      FROM donations d
      JOIN charities c ON d.charity_id = c.id
      WHERE d.charity_id = ?
      ORDER BY d.created_at DESC
    `).all(charityId);
        return rows.map(this.mapRowToDonation);
    },
    getAll() {
        const rows = db_1.db.prepare(`
      SELECT d.*, c.name as charity_name
      FROM donations d
      JOIN charities c ON d.charity_id = c.id
      ORDER BY d.created_at DESC
    `).all();
        return rows.map(this.mapRowToDonation);
    },
    getTotalDonationsCents() {
        const row = db_1.db.prepare(`SELECT SUM(amount_cents) as total FROM donations WHERE status = 'succeeded'`).get();
        return row?.total || 0;
    },
    mapRowToDonation(row) {
        return {
            id: row.id,
            user_id: row.user_id || undefined,
            donor_name: row.donor_name || undefined,
            donor_email: row.donor_email || undefined,
            charity_id: row.charity_id,
            charity_name: row.charity_name,
            amount_cents: row.amount_cents,
            frequency: row.frequency,
            stripe_payment_intent_id: row.stripe_payment_intent_id || undefined,
            status: row.status,
            is_independent: true,
            created_at: row.created_at,
        };
    }
};
