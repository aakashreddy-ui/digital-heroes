import { winnerRepository } from '../repositories/winnerRepository';
import { Winner, WinnerVerificationStatus, PayoutStatus } from '../../../shared/types';

export class WinnerServiceError extends Error {
  constructor(message: string, public errorCode: string = 'WINNER_ERROR') {
    super(message);
    this.name = 'WinnerServiceError';
  }
}

export const winnerService = {
  getUserWinnings(userId: string): Winner[] {
    return winnerRepository.getByUserId(userId);
  },

  getWinnerById(id: string): Winner {
    const winner = winnerRepository.getById(id);
    if (!winner) {
      throw new WinnerServiceError('Winner record not found', 'NOT_FOUND');
    }
    return winner;
  },

  submitProof(
    userId: string,
    winnerId: string,
    fileUrl: string,
    fileName: string,
    fileType?: string,
    fileSize?: number
  ): Winner {
    const winner = winnerRepository.getById(winnerId);
    if (!winner) {
      throw new WinnerServiceError('Winner record not found.', 'NOT_FOUND');
    }

    if (winner.user_id !== userId) {
      throw new WinnerServiceError('Access denied.', 'UNAUTHORIZED');
    }

    if (winner.verification_status === 'approved') {
      throw new WinnerServiceError('This win has already been approved and verified.', 'ALREADY_APPROVED');
    }

    const updated = winnerRepository.uploadProof(winnerId, fileUrl, fileName, fileType, fileSize);
    if (!updated) {
      throw new WinnerServiceError('Failed to upload winner proof.', 'UPLOAD_FAILED');
    }

    return updated;
  },

  adminVerifyWinner(
    adminId: string,
    winnerId: string,
    approved: boolean,
    notes?: string
  ): Winner {
    const winner = winnerRepository.getById(winnerId);
    if (!winner) {
      throw new WinnerServiceError('Winner record not found.', 'NOT_FOUND');
    }

    if (!winner.proof_url && approved) {
      throw new WinnerServiceError('Cannot approve a winner without uploaded proof scorecard.', 'NO_PROOF_UPLOADED');
    }

    const verified = winnerRepository.verifyWinner(winnerId, adminId, approved, notes);
    if (!verified) {
      throw new WinnerServiceError('Failed to verify winner.', 'VERIFY_FAILED');
    }

    return verified;
  },

  adminMarkPayout(
    adminId: string,
    winnerId: string,
    payoutReference?: string
  ): Winner {
    if (!payoutReference?.trim()) {
      throw new WinnerServiceError('A real payout transaction reference is required.', 'PAYOUT_REFERENCE_REQUIRED');
    }
    const winner = winnerRepository.getById(winnerId);
    if (!winner) {
      throw new WinnerServiceError('Winner record not found.', 'NOT_FOUND');
    }

    if (winner.verification_status !== 'approved') {
      throw new WinnerServiceError('Only approved winners can be marked as paid.', 'NOT_APPROVED');
    }

    if (winner.payout_status === 'paid') {
      throw new WinnerServiceError('This payout has already been marked as paid.', 'ALREADY_PAID');
    }

    const paid = winnerRepository.markPayoutComplete(winnerId, adminId, payoutReference);
    if (!paid) {
      throw new WinnerServiceError('Failed to process payout.', 'PAYOUT_FAILED');
    }

    return paid;
  },

  adminGetAll(options?: {
    verificationStatus?: WinnerVerificationStatus;
    payoutStatus?: PayoutStatus;
    drawId?: string;
  }): Winner[] {
    return winnerRepository.getAll(options);
  }
};
