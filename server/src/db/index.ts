import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { SUBSCRIPTION_PLANS } from '../../../shared/types';

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'digital_heroes.sqlite');

let rawDb: SqlJsDatabase | null = null;

export function saveDbToDisk() {
  if (!rawDb) return;
  try {
    const data = rawDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Failed to save sqlite database to disk:', err);
  }
}

export interface PreparedStatement {
  get(...params: any[]): any;
  all(...params: any[]): any[];
  run(...params: any[]): { changes: number };
}

export const db = {
  getRaw(): SqlJsDatabase {
    if (!rawDb) {
      throw new Error('Database not initialized yet. Call await initDatabase() before using the database.');
    }
    return rawDb;
  },

  exec(sql: string) {
    const d = this.getRaw();
    d.exec(sql);
    saveDbToDisk();
  },

  pragma(_sql: string) {
    // No-op for WASM
  },

  prepare(sql: string): PreparedStatement {
    return {
      get: (...params: any[]) => {
        const d = db.getRaw();
        const normalizedParams = params.map(p => (p === undefined ? null : p));
        const stmt = d.prepare(sql);
        try {
          if (normalizedParams.length > 0) {
            stmt.bind(normalizedParams);
          }
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return undefined;
        } finally {
          stmt.free();
        }
      },

      all: (...params: any[]) => {
        const d = db.getRaw();
        const normalizedParams = params.map(p => (p === undefined ? null : p));
        const stmt = d.prepare(sql);
        const rows: any[] = [];
        try {
          if (normalizedParams.length > 0) {
            stmt.bind(normalizedParams);
          }
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          return rows;
        } finally {
          stmt.free();
        }
      },

      run: (...params: any[]) => {
        const d = db.getRaw();
        const normalizedParams = params.map(p => (p === undefined ? null : p));
        const stmt = d.prepare(sql);
        try {
          if (normalizedParams.length > 0) {
            stmt.bind(normalizedParams);
          }
          stmt.step();
          const changes = d.getRowsModified();
          saveDbToDisk();
          return { changes };
        } finally {
          stmt.free();
        }
      },
    };
  },

  transaction<T>(fn: (...args: any[]) => T): (...args: any[]) => T {
    return (...args: any[]) => {
      const result = fn(...args);
      saveDbToDisk();
      return result;
    };
  },
};

export async function initDatabase(): Promise<SqlJsDatabase> {
  if (rawDb) return rawDb;

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      rawDb = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Could not read existing sqlite file, creating fresh database:', err);
      rawDb = new SQL.Database();
    }
  } else {
    rawDb = new SQL.Database();
  }

  // Create tables and schema
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('visitor', 'subscriber', 'admin')),
      avatar_url TEXT,
      phone TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price_cents INTEGER NOT NULL CHECK (price_cents > 0),
      billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year')),
      stripe_price_id TEXT,
      description TEXT,
      features TEXT DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
      status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'past_due', 'cancelled', 'incomplete', 'inactive')),
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      current_period_start TEXT NOT NULL,
      current_period_end TEXT NOT NULL,
      cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS charities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      mission TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Community',
      logo_url TEXT NOT NULL,
      hero_image_url TEXT NOT NULL,
      website TEXT,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      upcoming_events TEXT DEFAULT '[]',
      impact_metrics TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_charities (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      charity_id TEXT NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
      contribution_percentage INTEGER NOT NULL DEFAULT 10 CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
      score_date TEXT NOT NULL,
      course_name TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CONSTRAINT unique_user_score_date UNIQUE (user_id, score_date)
    );

    CREATE TABLE IF NOT EXISTS draws (
      id TEXT PRIMARY KEY,
      draw_number INTEGER UNIQUE,
      draw_date TEXT NOT NULL,
      month_year TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'simulation', 'approved', 'published', 'completed')),
      method TEXT NOT NULL DEFAULT 'random' CHECK (method IN ('random', 'algorithmic')),
      winning_numbers TEXT NOT NULL DEFAULT '[]',
      jackpot_rollover_cents INTEGER NOT NULL DEFAULT 0,
      total_prize_pool_cents INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      published_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS draw_entries (
      id TEXT PRIMARY KEY,
      draw_id TEXT NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      numbers TEXT NOT NULL,
      matched_numbers TEXT NOT NULL DEFAULT '[]',
      match_count INTEGER NOT NULL DEFAULT 0,
      prize_tier TEXT,
      is_winner INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      CONSTRAINT unique_draw_user_entry UNIQUE (draw_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS prize_pools (
      id TEXT PRIMARY KEY,
      draw_id TEXT UNIQUE NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
      total_pool_cents INTEGER NOT NULL DEFAULT 0,
      subscriber_contribution_cents INTEGER NOT NULL DEFAULT 0,
      rollover_in_cents INTEGER NOT NULL DEFAULT 0,
      rollover_out_cents INTEGER NOT NULL DEFAULT 0,
      tier_5_pool_cents INTEGER NOT NULL DEFAULT 0,
      tier_4_pool_cents INTEGER NOT NULL DEFAULT 0,
      tier_3_pool_cents INTEGER NOT NULL DEFAULT 0,
      tier_5_winner_count INTEGER NOT NULL DEFAULT 0,
      tier_4_winner_count INTEGER NOT NULL DEFAULT 0,
      tier_3_winner_count INTEGER NOT NULL DEFAULT 0,
      tier_5_payout_per_winner_cents INTEGER NOT NULL DEFAULT 0,
      tier_4_payout_per_winner_cents INTEGER NOT NULL DEFAULT 0,
      tier_3_payout_per_winner_cents INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS winners (
      id TEXT PRIMARY KEY,
      draw_id TEXT NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      entry_id TEXT UNIQUE NOT NULL REFERENCES draw_entries(id) ON DELETE CASCADE,
      prize_tier TEXT NOT NULL,
      prize_amount_cents INTEGER NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'pending',
      payout_status TEXT NOT NULL DEFAULT 'pending',
      proof_url TEXT,
      proof_file_name TEXT,
      proof_uploaded_at TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      review_notes TEXT,
      paid_at TEXT,
      payout_reference TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS winner_proofs (
      id TEXT PRIMARY KEY,
      winner_id TEXT NOT NULL REFERENCES winners(id) ON DELETE CASCADE,
      file_url TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      original_filename TEXT NOT NULL,
      uploaded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payouts (
      id TEXT PRIMARY KEY,
      winner_id TEXT NOT NULL REFERENCES winners(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payout_method TEXT NOT NULL DEFAULT 'bank_transfer',
      transaction_reference TEXT,
      processed_at TEXT,
      processed_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      charity_id TEXT NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
      amount_cents INTEGER NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'one_off',
      donor_name TEXT,
      donor_email TEXT,
      stripe_payment_intent_id TEXT,
      status TEXT NOT NULL DEFAULT 'succeeded',
      is_independent INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      data TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_actions (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      action_type TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS draw_results (
      id TEXT PRIMARY KEY,
      draw_id TEXT NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
      payload TEXT NOT NULL DEFAULT '{}',
      is_published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_scores_user_date ON scores(user_id, score_date);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_winners_user ON winners(user_id);
    CREATE INDEX IF NOT EXISTS idx_winners_status ON winners(verification_status, payout_status);
    CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);
    CREATE INDEX IF NOT EXISTS idx_draw_entries_draw ON draw_entries(draw_id);
    CREATE INDEX IF NOT EXISTS idx_charities_featured ON charities(is_featured, is_active);
    CREATE INDEX IF NOT EXISTS idx_donations_charity ON donations(charity_id);
  `);

  // Seed default plans if not present
  for (const plan of SUBSCRIPTION_PLANS) {
    const existing = db.prepare('SELECT id FROM subscription_plans WHERE id = ?').get(plan.id);
    if (!existing) {
      db.prepare(`
        INSERT INTO subscription_plans (id, name, price_cents, billing_interval, description, features, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `).run(
        plan.id,
        plan.name,
        plan.price_cents,
        plan.billing_interval,
        plan.description,
        JSON.stringify(plan.features),
        new Date().toISOString()
      );
    }
  }

  saveDbToDisk();
  return rawDb;
}
