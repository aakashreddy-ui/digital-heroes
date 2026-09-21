import { db } from '../db';
import { UserProfile, UserRole } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export const userRepository = {
  findById(id: string): (UserProfile & { password_hash?: string | null }) | null {
    const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as UserRow | undefined;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      role: row.role,
      avatar_url: row.avatar_url || undefined,
      phone: row.phone || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      password_hash: row.password_hash,
    };
  },

  findByEmail(email: string): (UserProfile & { password_hash?: string | null }) | null {
    const row = db.prepare('SELECT * FROM profiles WHERE LOWER(email) = LOWER(?)').get(email) as UserRow | undefined;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      role: row.role,
      avatar_url: row.avatar_url || undefined,
      phone: row.phone || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      password_hash: row.password_hash,
    };
  },

  create(user: { email: string; password_hash: string; full_name: string; role?: UserRole; phone?: string }): UserProfile {
    const id = uuidv4();
    const role = user.role || 'subscriber';
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user.email.toLowerCase(), user.password_hash, user.full_name, role, user.phone || null, now, now);

    return {
      id,
      email: user.email.toLowerCase(),
      full_name: user.full_name,
      role,
      phone: user.phone,
      created_at: now,
      updated_at: now,
    };
  },

  update(id: string, updates: Partial<{ full_name: string; phone: string; role: UserRole; avatar_url: string }>): UserProfile | null {
    const current = this.findById(id);
    if (!current) return null;

    const full_name = updates.full_name ?? current.full_name;
    const phone = updates.phone ?? current.phone ?? null;
    const role = updates.role ?? current.role;
    const avatar_url = updates.avatar_url ?? current.avatar_url ?? null;
    const updated_at = new Date().toISOString();

    db.prepare(`
      UPDATE profiles
      SET full_name = ?, phone = ?, role = ?, avatar_url = ?, updated_at = ?
      WHERE id = ?
    `).run(full_name, phone, role, avatar_url, updated_at, id);

    return this.findById(id);
  },

  getAll(options?: { role?: string; search?: string; limit?: number; offset?: number }) {
    let query = `
      SELECT p.*, s.status as subscription_status, s.plan_id as subscription_plan
      FROM profiles p
      LEFT JOIN subscriptions s ON p.id = s.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.role) {
      query += ` AND p.role = ?`;
      params.push(options.role);
    }

    if (options?.search) {
      query += ` AND (LOWER(p.full_name) LIKE ? OR LOWER(p.email) LIKE ?)`;
      params.push(`%${options.search.toLowerCase()}%`, `%${options.search.toLowerCase()}%`);
    }

    query += ` ORDER BY p.created_at DESC`;

    if (options?.limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(options.limit, options.offset || 0);
    }

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => ({
      id: r.id,
      email: r.email,
      full_name: r.full_name,
      role: r.role,
      avatar_url: r.avatar_url,
      phone: r.phone,
      created_at: r.created_at,
      updated_at: r.updated_at,
      subscription_status: r.subscription_status || 'inactive',
      subscription_plan: r.subscription_plan,
    }));
  },

  count(options?: { role?: string; search?: string }): number {
    let query = `SELECT COUNT(*) as count FROM profiles WHERE 1=1`;
    const params: any[] = [];

    if (options?.role) {
      query += ` AND role = ?`;
      params.push(options.role);
    }

    if (options?.search) {
      query += ` AND (LOWER(full_name) LIKE ? OR LOWER(email) LIKE ?)`;
      params.push(`%${options.search.toLowerCase()}%`, `%${options.search.toLowerCase()}%`);
    }

    const result = db.prepare(query).get(...params) as { count: number };
    return result.count;
  },
};
