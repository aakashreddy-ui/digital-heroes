"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.winnerService = exports.WinnerServiceError = void 0;
const winnerRepository_1 = require("../repositories/winnerRepository");
class WinnerServiceError extends Error {
    errorCode;
    constructor(message, errorCode = 'WINNER_ERROR') {
        super(message);
        this.errorCode = errorCode;
        this.name = 'WinnerServiceError';
    }
}
exports.WinnerServiceError = WinnerServiceError;
exports.winnerService = {
    getUserWinnings(userId) {
        return winnerRepository_1.winnerRepository.getByUserId(userId);
    },
    getWinnerById(id) {
        const winner = winnerRepository_1.winnerRepository.getById(id);
        if (!winner) {
            throw new WinnerServiceError('Winner record not found', 'NOT_FOUND');
        }
        return winner;
    },
    submitProof(userId, winnerId, fileUrl, fileName, fileType, fileSize) {
        const winner = winnerRepository_1.winnerRepository.getById(winnerId);
        if (!winner) {
            throw new WinnerServiceError('Winner record not found.', 'NOT_FOUND');
        }
        if (winner.user_id !== userId) {
            throw new WinnerServiceError('Access denied.', 'UNAUTHORIZED');
        }
        if (winner.verification_status === 'approved') {
            throw new WinnerServiceError('This win has already been approved and verified.', 'ALREADY_APPROVED');
        }
        const updated = winnerRepository_1.winnerRepository.uploadProof(winnerId, fileUrl, fileName, fileType, fileSize);
        if (!updated) {
            throw new WinnerServiceError('Failed to upload winner proof.', 'UPLOAD_FAILED');
        }
        return updated;
    },
    adminVerifyWinner(adminId, winnerId, approved, notes) {
        const winner = winnerRepository_1.winnerRepository.getById(winnerId);
        if (!winner) {
            throw new WinnerServiceError('Winner record not found.', 'NOT_FOUND');
        }
        if (!winner.proof_url && approved) {
            throw new WinnerServiceError('Cannot approve a winner without uploaded proof scorecard.', 'NO_PROOF_UPLOADED');
        }
        const verified = winnerRepository_1.winnerRepository.verifyWinner(winnerId, adminId, approved, notes);
        if (!verified) {
            throw new WinnerServiceError('Failed to verify winner.', 'VERIFY_FAILED');
        }
        return verified;
    },
    adminMarkPayout(adminId, winnerId, payoutReference) {
        const winner = winnerRepository_1.winnerRepository.getById(winnerId);
        if (!winner) {
            throw new WinnerServiceError('Winner record not found.', 'NOT_FOUND');
        }
        if (winner.verification_status !== 'approved') {
            throw new WinnerServiceError('Only approved winners can be marked as paid.', 'NOT_APPROVED');
        }
        if (winner.payout_status === 'paid') {
            throw new WinnerServiceError('This payout has already been marked as paid.', 'ALREADY_PAID');
        }
        const paid = winnerRepository_1.winnerRepository.markPayoutComplete(winnerId, adminId, payoutReference);
        if (!paid) {
            throw new WinnerServiceError('Failed to process payout.', 'PAYOUT_FAILED');
        }
        return paid;
    },
    adminGetAll(options) {
        return winnerRepository_1.winnerRepository.getAll(options);
    }
};
