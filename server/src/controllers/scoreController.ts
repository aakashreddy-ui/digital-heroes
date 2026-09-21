import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { scoreService } from '../services/scoreService';
import { sendSuccess } from '../middleware/error';
import { scoreSchema, validate } from '../validators';

export const scoreController = {
  getUserScores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const scores = scoreService.getUserScores(userId);
      return sendSuccess(res, scores, 'Scores retrieved');
    } catch (err) {
      next(err);
    }
  },

  addScore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { score, score_date, course_name, notes } = validate(scoreSchema, req.body);
      const result = scoreService.addScore(userId, {
        score: Number(score),
        scoreDate: score_date,
        courseName: course_name,
        notes,
      });
      return sendSuccess(res, result, 'Score added successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  updateScore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);
      const { score, score_date, course_name, notes } = req.body;
      const updated = scoreService.updateScore(userId, id, {
        score: score !== undefined ? Number(score) : undefined,
        scoreDate: score_date,
        courseName: course_name,
        notes,
      });
      return sendSuccess(res, updated, 'Score updated successfully');
    } catch (err) {
      next(err);
    }
  },

  deleteScore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);
      scoreService.deleteScore(userId, id);
      return sendSuccess(res, { id }, 'Score deleted successfully');
    } catch (err) {
      next(err);
    }
  }
};
