import { db } from '../db';
import { IndependentDonation } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export const donationRepository = {
  create(data: {
    userId?: string;
    donorName?: string;
    donorEmail?: string;
    charityId: string;
    amountCents: number;
    frequency?: 'one_off' | 'monthly';
    stripePaymentIntentId?: string;
    status?: 'succeeded' | 'pending' | 'failed';
  }): IndependentDonation {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO donations (id, user_id, donor_name, donor_email, charity_id, amount_cents, frequency, stripe_payment_intent_id, status, is_independent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id,
      data.userId || null,
      data.donorName || null,
      data.donorEmail || null,
      data.charityId,
      data.amountCents,
      data.frequency || 'one_off',
      data.stripePaymentIntentId || null,
      data.status || 'succeeded',
      now
    );

    return this.getById(id)!;
  },

  getById(id: string): IndependentDonation | null {
    const row = db.prepare(`
      SELECT d.*, c.name as charity_name
      FROM donations d
      JOIN charities c ON d.charity_id = c.id
      WHERE d.id = ?
    `).get(id) as any;

    if (!row) return null;
    return this.mapRowToDonation(row);
  },

  getByUserId(userId: string): IndependentDonation[] {
    const rows = db.prepare(`
      SELECT d.*, c.name as charity_name
      FROM donations d
      JOIN charities c ON d.charity_id = c.id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
    `).all(userId) as any[];

    return rows.map(this.mapRowToDonation);
  },

  getByCharityId(charityId: string): IndependentDonation[] {
    const rows = db.prepare(`
      SELECT d.*, c.name as charity_name
      FROM donations d
      JOIN charities c ON d.charity_id = c.id
      WHERE d.charity_id = ?
      ORDER BY d.created_at DESC
    `).all(charityId) as any[];

    return rows.map(this.mapRowToDonation);
  },

  getAll(): IndependentDonation[] {
    const rows = db.prepare(`
      SELECT d.*, c.name as charity_name
      FROM donations d
      JOIN charities c ON d.charity_id = c.id
      ORDER BY d.created_at DESC
    `).all() as any[];

    return rows.map(this.mapRowToDonation);
  },

  getTotalDonationsCents(): number {
    const row = db.prepare(`SELECT SUM(amount_cents) as total FROM donations WHERE status = 'succeeded'`).get() as { total: number | null };
    return row?.total || 0;
  },

  mapRowToDonation(row: any): IndependentDonation {
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
