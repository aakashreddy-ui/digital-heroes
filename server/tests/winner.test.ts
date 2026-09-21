import { describe, it, expect, beforeAll } from 'vitest';
import { initDatabase } from '../src/db';
import { winnerService } from '../src/services/winnerService';
import { winnerRepository } from '../src/repositories/winnerRepository';
import { userRepository } from '../src/repositories/userRepository';
import { drawRepository } from '../src/repositories/drawRepository';
import { v4 as uuidv4 } from 'uuid';

describe('Winner Verification and Payout Lifecycle', () => {
  let winnerUserId: string;
  let adminId: string;
  let winnerRecordId: string;

  beforeAll(async () => {
    await initDatabase();

    const winnerUser = userRepository.create({
      email: `winner_test_${Date.now()}@test.com`,
      password_hash: 'hash',
      full_name: 'Lucky Golfer',
    });
    winnerUserId = winnerUser.id;

    const adminUser = userRepository.create({
      email: `admin_verifier_${Date.now()}@test.com`,
      password_hash: 'hash',
      full_name: 'Admin Verifier',
      role: 'admin',
    });
    adminId = adminUser.id;

    // Create a mock draw & entry
    const draw = drawRepository.createDraw({
      drawDate: '2026-09-30',
      monthYear: '2026-09',
    });

    drawRepository.saveEntries([
      {
        drawId: draw.id,
        userId: winnerUserId,
        numbers: [31, 33, 35, 37, 39],
        matchedNumbers: [31, 33, 35, 37],
        matchCount: 4,
        prizeTier: 'four_match',
        isWinner: true,
      },
    ]);

    const entries = drawRepository.getEntriesForDraw(draw.id);
    const entryId = entries[0].id;

    const createdWinner = winnerRepository.createWinner({
      drawId: draw.id,
      userId: winnerUserId,
      entryId,
      prizeTier: 'four_match',
      prizeAmountCents: 35000,
    });
    winnerRecordId = createdWinner.id;
  });

  it('initial winner record starts in pending verification and pending payout state', () => {
    const winner = winnerService.getWinnerById(winnerRecordId);
    expect(winner.verification_status).toBe('pending');
    expect(winner.payout_status).toBe('pending');
    expect(winner.proof_url).toBeUndefined();
  });

  it('rejects approval if no proof has been uploaded', () => {
    expect(() => {
      winnerService.adminVerifyWinner(adminId, winnerRecordId, true, 'Trying to approve without proof');
    }).toThrowError(/Cannot approve a winner without uploaded proof/);
  });

  it('allows winner to upload proof scorecard', () => {
    const updated = winnerService.submitProof(
      winnerUserId,
      winnerRecordId,
      'https://storage.digitalheroes.test/proofs/scorecard_verified.jpg',
      'scorecard_verified.jpg',
      'image/jpeg',
      245000
    );

    expect(updated.proof_url).toBeDefined();
    expect(updated.proof_file_name).toBe('scorecard_verified.jpg');
    expect(updated.verification_status).toBe('pending');
  });

  it('allows admin to approve winner with review notes', () => {
    const approved = winnerService.adminVerifyWinner(
      adminId,
      winnerRecordId,
      true,
      'Official handicap platform verified. Match is valid.'
    );

    expect(approved.verification_status).toBe('approved');
    expect(approved.reviewed_by).toBe(adminId);
    expect(approved.review_notes).toContain('Match is valid');
  });

  it('allows admin to transition payout from pending to paid', () => {
    const paid = winnerService.adminMarkPayout(adminId, winnerRecordId, 'BANK-REF-9921');

    expect(paid.payout_status).toBe('paid');
    expect(paid.payout_reference).toBe('BANK-REF-9921');
    expect(paid.paid_at).toBeDefined();
  });

  it('handles rejection flow with notes', () => {
    // Create another winner to reject
    const mockEntryId = uuidv4();
    const otherWinner = winnerRepository.createWinner({
      drawId: uuidv4(),
      userId: winnerUserId,
      entryId: mockEntryId,
      prizeTier: 'three_match',
      prizeAmountCents: 10000,
    });

    winnerService.submitProof(winnerUserId, otherWinner.id, 'http://fake.url', 'tampered.png');

    const rejected = winnerService.adminVerifyWinner(
      adminId,
      otherWinner.id,
      false,
      'Scorecard date does not match competition rules.'
    );

    expect(rejected.verification_status).toBe('rejected');
    expect(rejected.review_notes).toContain('does not match');
    expect(rejected.payout_status).toBe('pending');
  });
});
