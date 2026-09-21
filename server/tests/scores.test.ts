import { describe, it, expect, beforeAll } from 'vitest';
import { initDatabase } from '../src/db';
import { scoreService } from '../src/services/scoreService';
import { userRepository } from '../src/repositories/userRepository';
import { v4 as uuidv4 } from 'uuid';

describe('Stableford Score Rules and FIFO Enforcement', () => {
  let testUserId: string;

  beforeAll(async () => {
    await initDatabase();
    const testUser = userRepository.create({
      email: `score_test_${Date.now()}@test.com`,
      password_hash: 'hash',
      full_name: 'Test Score Golfer',
    });
    testUserId = testUser.id;
  });

  it('rejects score below 1', () => {
    expect(() => {
      scoreService.addScore(testUserId, { score: 0, scoreDate: '2026-09-01' });
    }).toThrowError(/between 1 and 45/);

    expect(() => {
      scoreService.addScore(testUserId, { score: -5, scoreDate: '2026-09-01' });
    }).toThrowError(/between 1 and 45/);
  });

  it('rejects score above 45', () => {
    expect(() => {
      scoreService.addScore(testUserId, { score: 46, scoreDate: '2026-09-01' });
    }).toThrowError(/between 1 and 45/);

    expect(() => {
      scoreService.addScore(testUserId, { score: 100, scoreDate: '2026-09-01' });
    }).toThrowError(/between 1 and 45/);
  });

  it('rejects duplicate dates for the same user', () => {
    scoreService.addScore(testUserId, { score: 35, scoreDate: '2026-09-01' });

    expect(() => {
      scoreService.addScore(testUserId, { score: 38, scoreDate: '2026-09-01' });
    }).toThrowError(/already exists/);
  });

  it('allows editing an existing score', () => {
    const scores = scoreService.getUserScores(testUserId);
    const scoreToEdit = scores.find(s => s.score_date === '2026-09-01')!;

    const updated = scoreService.updateScore(testUserId, scoreToEdit.id, {
      score: 39,
      courseName: 'Championship Course',
    });

    expect(updated.score).toBe(39);
    expect(updated.course_name).toBe('Championship Course');
  });

  it('allows deleting an existing score', () => {
    const tempScore = scoreService.addScore(testUserId, { score: 32, scoreDate: '2026-08-15' });
    const success = scoreService.deleteScore(testUserId, tempScore.score.id);
    expect(success).toBe(true);

    const userScores = scoreService.getUserScores(testUserId);
    expect(userScores.some(s => s.id === tempScore.score.id)).toBe(false);
  });

  it('retains strictly the latest 5 scores and automatically removes the oldest when a 6th is added', () => {
    // Clear existing scores for fresh user test
    const freshUser = userRepository.create({
      email: `fifo_test_${Date.now()}@test.com`,
      password_hash: 'hash',
      full_name: 'FIFO Test Golfer',
    });
    const uid = freshUser.id;

    // Add 5 distinct scores in chronological order
    scoreService.addScore(uid, { score: 31, scoreDate: '2026-09-01', courseName: 'Round 1' });
    scoreService.addScore(uid, { score: 35, scoreDate: '2026-09-05', courseName: 'Round 2' });
    scoreService.addScore(uid, { score: 28, scoreDate: '2026-09-10', courseName: 'Round 3' });
    scoreService.addScore(uid, { score: 39, scoreDate: '2026-09-15', courseName: 'Round 4' });
    scoreService.addScore(uid, { score: 34, scoreDate: '2026-09-20', courseName: 'Round 5' });

    let current = scoreService.getUserScores(uid);
    expect(current).toHaveLength(5);
    // Verifying reverse chronological ordering (newest first)
    expect(current[0].score_date).toBe('2026-09-20');
    expect(current[0].score).toBe(34);
    expect(current[4].score_date).toBe('2026-09-01');
    expect(current[4].score).toBe(31);

    // Now add a 6th score (Sept 25)
    scoreService.addScore(uid, { score: 40, scoreDate: '2026-09-25', courseName: 'Round 6' });

    const updated = scoreService.getUserScores(uid);
    // Exactly 5 retained
    expect(updated).toHaveLength(5);
    // Newest is Sept 25 with 40
    expect(updated[0].score_date).toBe('2026-09-25');
    expect(updated[0].score).toBe(40);
    // Oldest (Sept 01 with 31) must have been automatically removed!
    const dates = updated.map(s => s.score_date);
    expect(dates).not.toContain('2026-09-01');
    expect(dates).toContain('2026-09-05');
  });

  it('orders scores in reverse chronological order (newest first)', () => {
    const user = userRepository.create({
      email: `order_test_${Date.now()}@test.com`,
      password_hash: 'hash',
      full_name: 'Ordering Golfer',
    });
    const uid = user.id;

    scoreService.addScore(uid, { score: 30, scoreDate: '2026-09-02' });
    scoreService.addScore(uid, { score: 36, scoreDate: '2026-09-14' });
    scoreService.addScore(uid, { score: 33, scoreDate: '2026-09-08' });

    const list = scoreService.getUserScores(uid);
    expect(list[0].score_date).toBe('2026-09-14');
    expect(list[1].score_date).toBe('2026-09-08');
    expect(list[2].score_date).toBe('2026-09-02');
  });
});
