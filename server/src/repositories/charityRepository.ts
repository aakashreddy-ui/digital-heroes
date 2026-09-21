import { db } from '../db';
import { Charity, UserCharitySelection, MIN_CHARITY_PERCENTAGE } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export const charityRepository = {
  getAll(options?: { category?: string; search?: string; featuredOnly?: boolean; activeOnly?: boolean }): Charity[] {
    let query = 'SELECT * FROM charities WHERE 1=1';
    const params: any[] = [];

    if (options?.activeOnly !== false) {
      query += ' AND is_active = 1';
    }

    if (options?.featuredOnly) {
      query += ' AND is_featured = 1';
    }

    if (options?.category && options.category !== 'All') {
      query += ' AND category = ?';
      params.push(options.category);
    }

    if (options?.search) {
      query += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(mission) LIKE ?)';
      params.push(`%${options.search.toLowerCase()}%`, `%${options.search.toLowerCase()}%`, `%${options.search.toLowerCase()}%`);
    }

    query += ' ORDER BY is_featured DESC, name ASC';

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(this.mapRowToCharity);
  },

  getById(id: string): Charity | null {
    const row = db.prepare('SELECT * FROM charities WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRowToCharity(row);
  },

  getBySlug(slug: string): Charity | null {
    const row = db.prepare('SELECT * FROM charities WHERE slug = ?').get(slug) as any;
    if (!row) return null;
    return this.mapRowToCharity(row);
  },

  create(data: Omit<Charity, 'id' | 'created_at' | 'updated_at'>): Charity {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO charities (
        id, name, slug, mission, description, category, logo_url, hero_image_url,
        website, is_featured, is_active, upcoming_events, impact_metrics, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.slug,
      data.mission,
      data.description,
      data.category,
      data.logo_url,
      data.hero_image_url,
      data.website || null,
      data.is_featured ? 1 : 0,
      data.is_active ? 1 : 0,
      JSON.stringify(data.upcoming_events || []),
      JSON.stringify(data.impact_metrics || []),
      now,
      now
    );

    return this.getById(id)!;
  },

  update(id: string, data: Partial<Charity>): Charity | null {
    const current = this.getById(id);
    if (!current) return null;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE charities
      SET name = ?, slug = ?, mission = ?, description = ?, category = ?,
          logo_url = ?, hero_image_url = ?, website = ?, is_featured = ?,
          is_active = ?, upcoming_events = ?, impact_metrics = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.name ?? current.name,
      data.slug ?? current.slug,
      data.mission ?? current.mission,
      data.description ?? current.description,
      data.category ?? current.category,
      data.logo_url ?? current.logo_url,
      data.hero_image_url ?? current.hero_image_url,
      data.website !== undefined ? data.website : current.website,
      data.is_featured !== undefined ? (data.is_featured ? 1 : 0) : (current.is_featured ? 1 : 0),
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : (current.is_active ? 1 : 0),
      JSON.stringify(data.upcoming_events ?? current.upcoming_events),
      JSON.stringify(data.impact_metrics ?? current.impact_metrics),
      now,
      id
    );

    return this.getById(id);
  },

  delete(id: string): boolean {
    const res = db.prepare('UPDATE charities SET is_active = 0, updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    return res.changes > 0;
  },

  getUserCharity(userId: string): UserCharitySelection | null {
    const row = db.prepare(`
      SELECT uc.*, c.name, c.slug, c.mission, c.description, c.category, c.logo_url, c.hero_image_url, c.website, c.is_featured, c.is_active, c.upcoming_events, c.impact_metrics, c.created_at as c_created_at
      FROM user_charities uc
      JOIN charities c ON uc.charity_id = c.id
      WHERE uc.user_id = ?
    `).get(userId) as any;

    if (!row) return null;

    return {
      id: row.id,
      user_id: row.user_id,
      charity_id: row.charity_id,
      contribution_percentage: row.contribution_percentage,
      updated_at: row.updated_at,
      charity: {
        id: row.charity_id,
        name: row.name,
        slug: row.slug,
        mission: row.mission,
        description: row.description,
        category: row.category,
        logo_url: row.logo_url,
        hero_image_url: row.hero_image_url,
        website: row.website,
        is_featured: Boolean(row.is_featured),
        is_active: Boolean(row.is_active),
        upcoming_events: JSON.parse(row.upcoming_events || '[]'),
        impact_metrics: JSON.parse(row.impact_metrics || '[]'),
        created_at: row.c_created_at,
      },
    };
  },

  setUserCharity(userId: string, charityId: string, contributionPercentage: number = MIN_CHARITY_PERCENTAGE): UserCharitySelection {
    const pct = Math.max(MIN_CHARITY_PERCENTAGE, Math.min(100, Math.floor(contributionPercentage)));
    const existing = db.prepare('SELECT id FROM user_charities WHERE user_id = ?').get(userId) as { id: string } | undefined;
    const now = new Date().toISOString();

    if (existing) {
      db.prepare(`
        UPDATE user_charities
        SET charity_id = ?, contribution_percentage = ?, updated_at = ?
        WHERE user_id = ?
      `).run(charityId, pct, now, userId);
    } else {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO user_charities (id, user_id, charity_id, contribution_percentage, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, userId, charityId, pct, now, now);
    }

    return this.getUserCharity(userId)!;
  },

  mapRowToCharity(row: any): Charity {
    const safeParse = (str: any) => {
      if (!str || typeof str !== 'string' || !str.trim()) return [];
      try {
        return JSON.parse(str);
      } catch {
        return [];
      }
    };

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      mission: row.mission,
      description: row.description,
      category: row.category,
      logo_url: row.logo_url,
      hero_image_url: row.hero_image_url,
      website: row.website,
      is_featured: Boolean(row.is_featured),
      is_active: Boolean(row.is_active),
      upcoming_events: safeParse(row.upcoming_events),
      impact_metrics: safeParse(row.impact_metrics),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },
};
