"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drawRepository = void 0;
const db_1 = require("../db");
const uuid_1 = require("uuid");
exports.drawRepository = {
    getLatestPublishedDraw() {
        const row = db_1.db.prepare(`
      SELECT * FROM draws 
      WHERE status IN ('published', 'completed')
      ORDER BY draw_date DESC, created_at DESC
      LIMIT 1
    `).get();
        if (!row)
            return null;
        return this.mapRowToDraw(row);
    },
    getUpcomingDraw() {
        const row = db_1.db.prepare(`
      SELECT * FROM draws
      WHERE status IN ('draft', 'simulation', 'approved')
      ORDER BY draw_date ASC
      LIMIT 1
    `).get();
        if (!row)
            return null;
        return this.mapRowToDraw(row);
    },
    getById(id) {
        const row = db_1.db.prepare('SELECT * FROM draws WHERE id = ?').get(id);
        if (!row)
            return null;
        return this.mapRowToDraw(row);
    },
    getAll() {
        const rows = db_1.db.prepare('SELECT * FROM draws ORDER BY draw_date DESC, created_at DESC').all();
        return rows.map(this.mapRowToDraw);
    },
    createDraw(data) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        // Auto-increment draw_number
        const maxNumRow = db_1.db.prepare('SELECT MAX(draw_number) as max_num FROM draws').get();
        const drawNumber = (maxNumRow?.max_num || 100) + 1;
        db_1.db.prepare(`
      INSERT INTO draws (id, draw_number, draw_date, month_year, status, method, winning_numbers, jackpot_rollover_cents, total_prize_pool_cents, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'draft', ?, '[]', ?, 0, ?, ?)
    `).run(id, drawNumber, data.drawDate, data.monthYear, data.method || 'random', data.jackpotRolloverCents || 0, now, now);
        return this.getById(id);
    },
    updateDraw(id, updates) {
        const current = this.getById(id);
        if (!current)
            return null;
        const now = new Date().toISOString();
        db_1.db.prepare(`
      UPDATE draws
      SET status = ?, method = ?, winning_numbers = ?, jackpot_rollover_cents = ?,
          total_prize_pool_cents = ?, published_at = ?, published_by = ?, updated_at = ?
      WHERE id = ?
    `).run(updates.status ?? current.status, updates.method ?? current.method, JSON.stringify(updates.winningNumbers ?? current.winning_numbers), updates.jackpotRolloverCents ?? current.jackpot_rollover_cents, updates.totalPrizePoolCents ?? current.total_prize_pool_cents, updates.publishedAt ?? current.published_at ?? null, updates.publishedBy ?? current.published_by ?? null, now, id);
        return this.getById(id);
    },
    savePrizePool(pool) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        // Delete existing pool for this draw if any
        db_1.db.prepare('DELETE FROM prize_pools WHERE draw_id = ?').run(pool.draw_id);
        db_1.db.prepare(`
      INSERT INTO prize_pools (
        id, draw_id, total_pool_cents, subscriber_contribution_cents, rollover_in_cents, rollover_out_cents,
        tier_5_pool_cents, tier_4_pool_cents, tier_3_pool_cents,
        tier_5_winner_count, tier_4_winner_count, tier_3_winner_count,
        tier_5_payout_per_winner_cents, tier_4_payout_per_winner_cents, tier_3_payout_per_winner_cents,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, pool.draw_id, pool.total_pool_cents, pool.subscriber_contribution_cents, pool.rollover_in_cents, pool.rollover_out_cents, pool.tier_5_pool_cents, pool.tier_4_pool_cents, pool.tier_3_pool_cents, pool.tier_5_winner_count, pool.tier_4_winner_count, pool.tier_3_winner_count, pool.tier_5_payout_per_winner_cents, pool.tier_4_payout_per_winner_cents, pool.tier_3_payout_per_winner_cents, now);
        return this.getPrizePoolByDrawId(pool.draw_id);
    },
    getPrizePoolByDrawId(drawId) {
        const row = db_1.db.prepare('SELECT * FROM prize_pools WHERE draw_id = ?').get(drawId);
        if (!row)
            return null;
        return {
            id: row.id,
            draw_id: row.draw_id,
            total_pool_cents: row.total_pool_cents,
            subscriber_contribution_cents: row.subscriber_contribution_cents,
            rollover_in_cents: row.rollover_in_cents,
            rollover_out_cents: row.rollover_out_cents,
            tier_5_pool_cents: row.tier_5_pool_cents,
            tier_4_pool_cents: row.tier_4_pool_cents,
            tier_3_pool_cents: row.tier_3_pool_cents,
            tier_5_winner_count: row.tier_5_winner_count,
            tier_4_winner_count: row.tier_4_winner_count,
            tier_3_winner_count: row.tier_3_winner_count,
            tier_5_payout_per_winner_cents: row.tier_5_payout_per_winner_cents,
            tier_4_payout_per_winner_cents: row.tier_4_payout_per_winner_cents,
            tier_3_payout_per_winner_cents: row.tier_3_payout_per_winner_cents,
            created_at: row.created_at,
        };
    },
    saveEntries(entries) {
        const insert = db_1.db.prepare(`
      INSERT OR REPLACE INTO draw_entries (id, draw_id, user_id, numbers, matched_numbers, match_count, prize_tier, is_winner, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const now = new Date().toISOString();
        const tx = db_1.db.transaction(() => {
            for (const e of entries) {
                insert.run((0, uuid_1.v4)(), e.drawId, e.userId, JSON.stringify(e.numbers), JSON.stringify(e.matchedNumbers), e.matchCount, e.prizeTier, e.isWinner ? 1 : 0, now);
            }
        });
        tx();
    },
    getEntriesForDraw(drawId) {
        const rows = db_1.db.prepare(`
      SELECT de.*, p.full_name as user_name
      FROM draw_entries de
      JOIN profiles p ON de.user_id = p.id
      WHERE de.draw_id = ?
      ORDER BY de.match_count DESC, de.created_at ASC
    `).all(drawId);
        return rows.map(r => ({
            id: r.id,
            draw_id: r.draw_id,
            user_id: r.user_id,
            user_name: r.user_name,
            numbers: JSON.parse(r.numbers || '[]'),
            matched_numbers: JSON.parse(r.matched_numbers || '[]'),
            match_count: r.match_count,
            prize_tier: r.prize_tier,
            is_winner: Boolean(r.is_winner),
            created_at: r.created_at,
        }));
    },
    saveDrawResult(drawId, payload, isPublished) {
        db_1.db.prepare(`
      INSERT INTO draw_results (id, draw_id, payload, is_published, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run((0, uuid_1.v4)(), drawId, JSON.stringify(payload), isPublished ? 1 : 0, new Date().toISOString());
    },
    getLatestDrawResult(drawId) {
        const row = db_1.db.prepare(`
      SELECT * FROM draw_results WHERE draw_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(drawId);
        if (!row)
            return null;
        return JSON.parse(row.payload || '{}');
    },
    getUserEntries(userId) {
        const rows = db_1.db.prepare(`
      SELECT de.*, d.draw_date, d.draw_number, d.status as draw_status
      FROM draw_entries de
      JOIN draws d ON de.draw_id = d.id
      WHERE de.user_id = ?
      ORDER BY d.draw_date DESC
    `).all(userId);
        return rows.map(r => ({
            id: r.id,
            draw_id: r.draw_id,
            user_id: r.user_id,
            numbers: JSON.parse(r.numbers || '[]'),
            matched_numbers: JSON.parse(r.matched_numbers || '[]'),
            match_count: r.match_count,
            prize_tier: r.prize_tier,
            is_winner: Boolean(r.is_winner),
            created_at: r.created_at,
            draw_date: r.draw_date,
            draw_number: r.draw_number,
            draw_status: r.draw_status,
        }));
    },
    mapRowToDraw(row) {
        const prizePool = db_1.db.prepare('SELECT * FROM prize_pools WHERE draw_id = ?').get(row.id);
        const stats = db_1.db.prepare(`
      SELECT COUNT(*) as total_entries, SUM(is_winner) as total_winners
      FROM draw_entries WHERE draw_id = ?
    `).get(row.id);
        return {
            id: row.id,
            draw_number: row.draw_number,
            draw_date: row.draw_date,
            month_year: row.month_year,
            status: row.status,
            method: row.method,
            winning_numbers: JSON.parse(row.winning_numbers || '[]'),
            jackpot_rollover_cents: row.jackpot_rollover_cents,
            total_prize_pool_cents: row.total_prize_pool_cents,
            published_at: row.published_at || undefined,
            published_by: row.published_by || undefined,
            created_at: row.created_at,
            updated_at: row.updated_at,
            total_entries: stats?.total_entries || 0,
            total_winners: stats?.total_winners || 0,
            prize_pool: prizePool ? {
                id: prizePool.id,
                draw_id: prizePool.draw_id,
                total_pool_cents: prizePool.total_pool_cents,
                subscriber_contribution_cents: prizePool.subscriber_contribution_cents,
                rollover_in_cents: prizePool.rollover_in_cents,
                rollover_out_cents: prizePool.rollover_out_cents,
                tier_5_pool_cents: prizePool.tier_5_pool_cents,
                tier_4_pool_cents: prizePool.tier_4_pool_cents,
                tier_3_pool_cents: prizePool.tier_3_pool_cents,
                tier_5_winner_count: prizePool.tier_5_winner_count,
                tier_4_winner_count: prizePool.tier_4_winner_count,
                tier_3_winner_count: prizePool.tier_3_winner_count,
                tier_5_payout_per_winner_cents: prizePool.tier_5_payout_per_winner_cents,
                tier_4_payout_per_winner_cents: prizePool.tier_4_payout_per_winner_cents,
                tier_3_payout_per_winner_cents: prizePool.tier_3_payout_per_winner_cents,
                created_at: prizePool.created_at,
            } : undefined,
        };
    },
};
