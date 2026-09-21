import { db } from '../db';
import { StablefordScore, MAX_STORED_SCORES } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export const scoreRepository = {
  getByUserId(userId: string): StablefordScore[] {
    const rows = db.prepare(`
      SELECT * FROM scores 
      WHERE user_id = ? 
      ORDER BY score_date DESC, created_at DESC
      LIMIT ?
    `).all(userId, MAX_STORED_SCORES) as any[];

    return rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      score: r.score,
      score_date: r.score_date,
      course_name: r.course_name || undefined,
      notes: r.notes || undefined,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  },

  getAllUserScoresRaw(userId: string): StablefordScore[] {
    const rows = db.prepare(`
      SELECT * FROM scores 
      WHERE user_id = ? 
      ORDER BY score_date DESC, created_at DESC
    `).all(userId) as any[];

    return rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      score: r.score,
      score_date: r.score_date,
      course_name: r.course_name || undefined,
      notes: r.notes || undefined,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  },

  getById(id: string): StablefordScore | null {
    const row = db.prepare('SELECT * FROM scores WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      user_id: row.user_id,
      score: row.score,
      score_date: row.score_date,
      course_name: row.course_name || undefined,
      notes: row.notes || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  findByUserAndDate(userId: string, scoreDate: string): StablefordScore | null {
    const row = db.prepare('SELECT * FROM scores WHERE user_id = ? AND score_date = ?').get(userId, scoreDate) as any;
    if (!row) return null;
    return {
      id: row.id,
      user_id: row.user_id,
      score: row.score,
      score_date: row.score_date,
      course_name: row.course_name || undefined,
      notes: row.notes || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  /**
   * Inserts a new score and enforces the 5-score FIFO rule atomically.
   * If adding the score results in > 5 scores, the oldest score (by score_date ASC, created_at ASC)
   * is automatically deleted from the database.
   */
  createScore(data: {
    userId: string;
    score: number;
    scoreDate: string;
    courseName?: string;
    notes?: string;
  }): StablefordScore {
    const insertTransaction = db.transaction(() => {
      const id = uuidv4();
      const now = new Date().toISOString();

      // 1. Insert new score
      db.prepare(`
        INSERT INTO scores (id, user_id, score, score_date, course_name, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.userId,
        data.score,
        data.scoreDate,
        data.courseName || null,
        data.notes || null,
        now,
        now
      );

      // 2. Count total scores for this user
      const countRow = db.prepare(`
        SELECT COUNT(*) as count FROM scores WHERE user_id = ?
      `).get(data.userId) as { count: number };

      // 3. If count exceeds MAX_STORED_SCORES (5), find and delete the oldest scores
      if (countRow.count > MAX_STORED_SCORES) {
        const excess = countRow.count - MAX_STORED_SCORES;
        // Oldest scores are lowest score_date, followed by lowest created_at
        const oldestRows = db.prepare(`
          SELECT id FROM scores
          WHERE user_id = ?
          ORDER BY score_date ASC, created_at ASC
          LIMIT ?
        `).all(data.userId, excess) as { id: string }[];

        for (const old of oldestRows) {
          db.prepare('DELETE FROM scores WHERE id = ?').run(old.id);
        }
      }

      return id;
    });

    const newId = insertTransaction();
    return this.getById(newId)!;
  },

  updateScore(
    id: string,
    userId: string,
    updates: { score?: number; scoreDate?: string; courseName?: string; notes?: string }
  ): StablefordScore | null {
    const current = this.getById(id);
    if (!current || current.user_id !== userId) return null;

    const score = updates.score ?? current.score;
    const scoreDate = updates.scoreDate ?? current.score_date;
    const courseName = updates.courseName !== undefined ? updates.courseName : current.course_name;
    const notes = updates.notes !== undefined ? updates.notes : current.notes;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE scores
      SET score = ?, score_date = ?, course_name = ?, notes = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(score, scoreDate, courseName || null, notes || null, now, id, userId);

    return this.getById(id);
  },

  deleteScore(id: string, userId: string): boolean {
    const res = db.prepare('DELETE FROM scores WHERE id = ? AND user_id = ?').run(id, userId);
    return res.changes > 0;
  },

  adminUpdateScore(id: string, updates: { score?: number; scoreDate?: string; courseName?: string; notes?: string }): StablefordScore | null {
    const current = this.getById(id);
    if (!current) return null;

    const score = updates.score ?? current.score;
    const scoreDate = updates.scoreDate ?? current.score_date;
    const courseName = updates.courseName !== undefined ? updates.courseName : current.course_name;
    const notes = updates.notes !== undefined ? updates.notes : current.notes;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE scores
      SET score = ?, score_date = ?, course_name = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).run(score, scoreDate, courseName || null, notes || null, now, id);

    return this.getById(id);
  }
};
