import { db } from '../db';
import { Winner, WinnerVerificationStatus, PayoutStatus, PrizeTier } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export const winnerRepository = {
  getById(id: string): Winner | null {
    const row = db.prepare(`
      SELECT w.*, p.full_name as user_name, p.email as user_email,
             d.draw_number, d.draw_date, d.winning_numbers,
             de.matched_numbers
      FROM winners w
      LEFT JOIN profiles p ON w.user_id = p.id
      LEFT JOIN draws d ON w.draw_id = d.id
      LEFT JOIN draw_entries de ON w.entry_id = de.id
      WHERE w.id = ?
    `).get(id) as any;

    if (!row) return null;
    return this.mapRowToWinner(row);
  },

  getAll(options?: {
    verificationStatus?: WinnerVerificationStatus;
    payoutStatus?: PayoutStatus;
    drawId?: string;
  }): Winner[] {
    let query = `
      SELECT w.*, p.full_name as user_name, p.email as user_email,
             d.draw_number, d.draw_date, d.winning_numbers,
             de.matched_numbers
      FROM winners w
      LEFT JOIN profiles p ON w.user_id = p.id
      LEFT JOIN draws d ON w.draw_id = d.id
      LEFT JOIN draw_entries de ON w.entry_id = de.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.verificationStatus) {
      query += ' AND w.verification_status = ?';
      params.push(options.verificationStatus);
    }

    if (options?.payoutStatus) {
      query += ' AND w.payout_status = ?';
      params.push(options.payoutStatus);
    }

    if (options?.drawId) {
      query += ' AND w.draw_id = ?';
      params.push(options.drawId);
    }

    query += ' ORDER BY w.created_at DESC';

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(this.mapRowToWinner);
  },

  getByUserId(userId: string): Winner[] {
    const rows = db.prepare(`
      SELECT w.*, p.full_name as user_name, p.email as user_email,
             d.draw_number, d.draw_date, d.winning_numbers,
             de.matched_numbers
      FROM winners w
      LEFT JOIN profiles p ON w.user_id = p.id
      LEFT JOIN draws d ON w.draw_id = d.id
      LEFT JOIN draw_entries de ON w.entry_id = de.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(userId) as any[];

    return rows.map(this.mapRowToWinner);
  },

  createWinner(data: {
    drawId: string;
    userId: string;
    entryId: string;
    prizeTier: PrizeTier;
    prizeAmountCents: number;
  }): Winner {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT OR REPLACE INTO winners (
        id, draw_id, user_id, entry_id, prize_tier, prize_amount_cents,
        verification_status, payout_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?)
    `).run(
      id,
      data.drawId,
      data.userId,
      data.entryId,
      data.prizeTier,
      data.prizeAmountCents,
      now,
      now
    );

    return this.getById(id)!;
  },

  uploadProof(winnerId: string, proofUrl: string, fileName: string, fileType?: string, fileSize?: number): Winner | null {
    const current = this.getById(winnerId);
    if (!current) return null;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE winners
      SET proof_url = ?, proof_file_name = ?, proof_uploaded_at = ?, updated_at = ?
      WHERE id = ?
    `).run(proofUrl, fileName, now, now, winnerId);

    // Also record in winner_proofs
    db.prepare(`
      INSERT INTO winner_proofs (id, winner_id, file_url, file_type, file_size_bytes, original_filename, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      winnerId,
      proofUrl,
      fileType || 'image/png',
      fileSize || 0,
      fileName,
      now
    );

    return this.getById(winnerId);
  },

  verifyWinner(winnerId: string, adminId: string, approved: boolean, notes?: string): Winner | null {
    const current = this.getById(winnerId);
    if (!current) return null;

    const status: WinnerVerificationStatus = approved ? 'approved' : 'rejected';
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE winners
      SET verification_status = ?, reviewed_by = ?, reviewed_at = ?, review_notes = ?, updated_at = ?
      WHERE id = ?
    `).run(status, adminId, now, notes || null, now, winnerId);

    return this.getById(winnerId);
  },

  markPayoutComplete(winnerId: string, adminId: string, payoutRef?: string): Winner | null {
    const current = this.getById(winnerId);
    if (!current) return null;

    const now = new Date().toISOString();
    const reference = payoutRef;
    if (!reference) return null;

    db.prepare(`
      UPDATE winners
      SET payout_status = 'paid', paid_at = ?, payout_reference = ?, updated_at = ?
      WHERE id = ?
    `).run(now, reference, now, winnerId);

    // Also insert into payouts table
    db.prepare(`
      INSERT INTO payouts (id, winner_id, user_id, amount_cents, status, payout_method, transaction_reference, processed_at, processed_by, created_at)
      VALUES (?, ?, ?, ?, 'completed', 'bank_transfer', ?, ?, ?, ?)
    `).run(
      uuidv4(),
      winnerId,
      current.user_id,
      current.prize_amount_cents,
      reference,
      now,
      adminId,
      now
    );

    return this.getById(winnerId);
  },

  mapRowToWinner(row: any): Winner {
    return {
      id: row.id,
      draw_id: row.draw_id,
      draw_number: row.draw_number,
      draw_date: row.draw_date,
      user_id: row.user_id,
      user_name: row.user_name,
      user_email: row.user_email,
      entry_id: row.entry_id,
      prize_tier: row.prize_tier,
      prize_amount_cents: row.prize_amount_cents,
      verification_status: row.verification_status,
      payout_status: row.payout_status,
      proof_url: row.proof_url || undefined,
      proof_file_name: row.proof_file_name || undefined,
      proof_uploaded_at: row.proof_uploaded_at || undefined,
      reviewed_by: row.reviewed_by || undefined,
      reviewed_at: row.reviewed_at || undefined,
      review_notes: row.review_notes || undefined,
      paid_at: row.paid_at || undefined,
      payout_reference: row.payout_reference || undefined,
      matched_numbers: row.matched_numbers ? JSON.parse(row.matched_numbers) : undefined,
      winning_numbers: row.winning_numbers ? JSON.parse(row.winning_numbers) : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
};
