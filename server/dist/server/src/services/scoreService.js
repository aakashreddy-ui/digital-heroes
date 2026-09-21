"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreService = exports.ScoreValidationError = void 0;
const scoreRepository_1 = require("../repositories/scoreRepository");
const types_1 = require("../../../shared/types");
class ScoreValidationError extends Error {
    errorCode;
    constructor(message, errorCode = 'INVALID_SCORE') {
        super(message);
        this.errorCode = errorCode;
        this.name = 'ScoreValidationError';
    }
}
exports.ScoreValidationError = ScoreValidationError;
exports.scoreService = {
    getUserScores(userId) {
        return scoreRepository_1.scoreRepository.getByUserId(userId);
    },
    addScore(userId, data) {
        // 1. Validate score range (1-45)
        if (typeof data.score !== 'number' || isNaN(data.score)) {
            throw new ScoreValidationError('Score must be a valid number.', 'INVALID_SCORE_FORMAT');
        }
        if (data.score < types_1.SCORE_MIN || data.score > types_1.SCORE_MAX) {
            throw new ScoreValidationError(`Stableford score must be between ${types_1.SCORE_MIN} and ${types_1.SCORE_MAX}. Received: ${data.score}`, 'SCORE_OUT_OF_RANGE');
        }
        // 2. Validate score date
        if (!data.scoreDate || typeof data.scoreDate !== 'string') {
            throw new ScoreValidationError('Score date is required.', 'MISSING_SCORE_DATE');
        }
        const parsedDate = new Date(data.scoreDate);
        if (isNaN(parsedDate.getTime())) {
            throw new ScoreValidationError('Score date format is invalid. Use YYYY-MM-DD.', 'INVALID_DATE_FORMAT');
        }
        // Format to YYYY-MM-DD
        const formattedDate = data.scoreDate.split('T')[0];
        // 3. Check for duplicate date for this user
        const existing = scoreRepository_1.scoreRepository.findByUserAndDate(userId, formattedDate);
        if (existing) {
            throw new ScoreValidationError(`A score for date ${formattedDate} already exists. Only one score per date is allowed.`, 'DUPLICATE_SCORE_DATE');
        }
        // 4. Create score using atomic repository method (auto-deletes oldest if > 5)
        const newScore = scoreRepository_1.scoreRepository.createScore({
            userId,
            score: Math.floor(data.score),
            scoreDate: formattedDate,
            courseName: data.courseName,
            notes: data.notes,
        });
        // 5. Fetch updated list (newest first, max 5)
        const currentScores = scoreRepository_1.scoreRepository.getByUserId(userId);
        return {
            score: newScore,
            scores: currentScores,
        };
    },
    updateScore(userId, id, data) {
        const existing = scoreRepository_1.scoreRepository.getById(id);
        if (!existing || existing.user_id !== userId) {
            throw new ScoreValidationError('Score not found or access denied.', 'SCORE_NOT_FOUND');
        }
        if (data.score !== undefined) {
            if (typeof data.score !== 'number' || isNaN(data.score) || data.score < types_1.SCORE_MIN || data.score > types_1.SCORE_MAX) {
                throw new ScoreValidationError(`Stableford score must be between ${types_1.SCORE_MIN} and ${types_1.SCORE_MAX}.`, 'SCORE_OUT_OF_RANGE');
            }
        }
        let formattedDate = undefined;
        if (data.scoreDate !== undefined) {
            const parsedDate = new Date(data.scoreDate);
            if (isNaN(parsedDate.getTime())) {
                throw new ScoreValidationError('Invalid date format.', 'INVALID_DATE_FORMAT');
            }
            formattedDate = data.scoreDate.split('T')[0];
            // Check if duplicate with another score
            const duplicate = scoreRepository_1.scoreRepository.findByUserAndDate(userId, formattedDate);
            if (duplicate && duplicate.id !== id) {
                throw new ScoreValidationError(`Another score already exists for date ${formattedDate}.`, 'DUPLICATE_SCORE_DATE');
            }
        }
        const updated = scoreRepository_1.scoreRepository.updateScore(id, userId, {
            score: data.score !== undefined ? Math.floor(data.score) : undefined,
            scoreDate: formattedDate,
            courseName: data.courseName,
            notes: data.notes,
        });
        if (!updated) {
            throw new ScoreValidationError('Failed to update score.', 'UPDATE_FAILED');
        }
        return updated;
    },
    deleteScore(userId, id) {
        const existing = scoreRepository_1.scoreRepository.getById(id);
        if (!existing || existing.user_id !== userId) {
            throw new ScoreValidationError('Score not found or access denied.', 'SCORE_NOT_FOUND');
        }
        return scoreRepository_1.scoreRepository.deleteScore(id, userId);
    }
};
