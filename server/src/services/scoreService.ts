import { scoreRepository } from '../repositories/scoreRepository';
import { StablefordScore, SCORE_MIN, SCORE_MAX, MAX_STORED_SCORES } from '../../../shared/types';

export class ScoreValidationError extends Error {
  constructor(message: string, public errorCode: string = 'INVALID_SCORE') {
    super(message);
    this.name = 'ScoreValidationError';
  }
}

export const scoreService = {
  getUserScores(userId: string): StablefordScore[] {
    return scoreRepository.getByUserId(userId);
  },

  addScore(userId: string, data: {
    score: number;
    scoreDate: string;
    courseName?: string;
    notes?: string;
  }): { score: StablefordScore; scores: StablefordScore[] } {
    // 1. Validate score range (1-45)
    if (typeof data.score !== 'number' || isNaN(data.score)) {
      throw new ScoreValidationError('Score must be a valid number.', 'INVALID_SCORE_FORMAT');
    }

    if (data.score < SCORE_MIN || data.score > SCORE_MAX) {
      throw new ScoreValidationError(
        `Stableford score must be between ${SCORE_MIN} and ${SCORE_MAX}. Received: ${data.score}`,
        'SCORE_OUT_OF_RANGE'
      );
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
    const existing = scoreRepository.findByUserAndDate(userId, formattedDate);
    if (existing) {
      throw new ScoreValidationError(
        `A score for date ${formattedDate} already exists. Only one score per date is allowed.`,
        'DUPLICATE_SCORE_DATE'
      );
    }

    // 4. Create score using atomic repository method (auto-deletes oldest if > 5)
    const newScore = scoreRepository.createScore({
      userId,
      score: Math.floor(data.score),
      scoreDate: formattedDate,
      courseName: data.courseName,
      notes: data.notes,
    });

    // 5. Fetch updated list (newest first, max 5)
    const currentScores = scoreRepository.getByUserId(userId);

    return {
      score: newScore,
      scores: currentScores,
    };
  },

  updateScore(userId: string, id: string, data: {
    score?: number;
    scoreDate?: string;
    courseName?: string;
    notes?: string;
  }): StablefordScore {
    const existing = scoreRepository.getById(id);
    if (!existing || existing.user_id !== userId) {
      throw new ScoreValidationError('Score not found or access denied.', 'SCORE_NOT_FOUND');
    }

    if (data.score !== undefined) {
      if (typeof data.score !== 'number' || isNaN(data.score) || data.score < SCORE_MIN || data.score > SCORE_MAX) {
        throw new ScoreValidationError(
          `Stableford score must be between ${SCORE_MIN} and ${SCORE_MAX}.`,
          'SCORE_OUT_OF_RANGE'
        );
      }
    }

    let formattedDate: string | undefined = undefined;
    if (data.scoreDate !== undefined) {
      const parsedDate = new Date(data.scoreDate);
      if (isNaN(parsedDate.getTime())) {
        throw new ScoreValidationError('Invalid date format.', 'INVALID_DATE_FORMAT');
      }
      formattedDate = data.scoreDate.split('T')[0];

      // Check if duplicate with another score
      const duplicate = scoreRepository.findByUserAndDate(userId, formattedDate);
      if (duplicate && duplicate.id !== id) {
        throw new ScoreValidationError(
          `Another score already exists for date ${formattedDate}.`,
          'DUPLICATE_SCORE_DATE'
        );
      }
    }

    const updated = scoreRepository.updateScore(id, userId, {
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

  deleteScore(userId: string, id: string): boolean {
    const existing = scoreRepository.getById(id);
    if (!existing || existing.user_id !== userId) {
      throw new ScoreValidationError('Score not found or access denied.', 'SCORE_NOT_FOUND');
    }

    return scoreRepository.deleteScore(id, userId);
  }
};
