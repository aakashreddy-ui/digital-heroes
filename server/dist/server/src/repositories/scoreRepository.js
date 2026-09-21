"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreRepository = void 0;
const db_1 = require("../db");
const types_1 = require("../../../shared/types");
const uuid_1 = require("uuid");
exports.scoreRepository = {
    getByUserId(userId) {
        const rows = db_1.db.prepare(`
      SELECT * FROM scores 
      WHERE user_id = ? 
      ORDER BY score_date DESC, created_at DESC
      LIMIT ?
    `).all(userId, types_1.MAX_STORED_SCORES);
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
    getAllUserScoresRaw(userId) {
        const rows = db_1.db.prepare(`
      SELECT * FROM scores 
      WHERE user_id = ? 
      ORDER BY score_date DESC, created_at DESC
    `).all(userId);
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
    getById(id) {
        const row = db_1.db.prepare('SELECT * FROM scores WHERE id = ?').get(id);
        if (!row)
            return null;
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
    findByUserAndDate(userId, scoreDate) {
        const row = db_1.db.prepare('SELECT * FROM scores WHERE user_id = ? AND score_date = ?').get(userId, scoreDate);
        if (!row)
            return null;
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
    createScore(data) {
        const insertTransaction = db_1.db.transaction(() => {
            const id = (0, uuid_1.v4)();
            const now = new Date().toISOString();
            // 1. Insert new score
            db_1.db.prepare(`
        INSERT INTO scores (id, user_id, score, score_date, course_name, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.userId, data.score, data.scoreDate, data.courseName || null, data.notes || null, now, now);
            // 2. Count total scores for this user
            const countRow = db_1.db.prepare(`
        SELECT COUNT(*) as count FROM scores WHERE user_id = ?
      `).get(data.userId);
            // 3. If count exceeds MAX_STORED_SCORES (5), find and delete the oldest scores
            if (countRow.count > types_1.MAX_STORED_SCORES) {
                const excess = countRow.count - types_1.MAX_STORED_SCORES;
                // Oldest scores are lowest score_date, followed by lowest created_at
                const oldestRows = db_1.db.prepare(`
          SELECT id FROM scores
          WHERE user_id = ?
          ORDER BY score_date ASC, created_at ASC
          LIMIT ?
        `).all(data.userId, excess);
                for (const old of oldestRows) {
                    db_1.db.prepare('DELETE FROM scores WHERE id = ?').run(old.id);
                }
            }
            return id;
        });
        const newId = insertTransaction();
        return this.getById(newId);
    },
    updateScore(id, userId, updates) {
        const current = this.getById(id);
        if (!current || current.user_id !== userId)
            return null;
        const score = updates.score ?? current.score;
        const scoreDate = updates.scoreDate ?? current.score_date;
        const courseName = updates.courseName !== undefined ? updates.courseName : current.course_name;
        const notes = updates.notes !== undefined ? updates.notes : current.notes;
        const now = new Date().toISOString();
        db_1.db.prepare(`
      UPDATE scores
      SET score = ?, score_date = ?, course_name = ?, notes = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(score, scoreDate, courseName || null, notes || null, now, id, userId);
        return this.getById(id);
    },
    deleteScore(id, userId) {
        const res = db_1.db.prepare('DELETE FROM scores WHERE id = ? AND user_id = ?').run(id, userId);
        return res.changes > 0;
    },
    adminUpdateScore(id, updates) {
        const current = this.getById(id);
        if (!current)
            return null;
        const score = updates.score ?? current.score;
        const scoreDate = updates.scoreDate ?? current.score_date;
        const courseName = updates.courseName !== undefined ? updates.courseName : current.course_name;
        const notes = updates.notes !== undefined ? updates.notes : current.notes;
        const now = new Date().toISOString();
        db_1.db.prepare(`
      UPDATE scores
      SET score = ?, score_date = ?, course_name = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).run(score, scoreDate, courseName || null, notes || null, now, id);
        return this.getById(id);
    }
};
