import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { userRepository } from '../repositories/userRepository';
import { subscriptionRepository } from '../repositories/subscriptionRepository';
import { scoreRepository } from '../repositories/scoreRepository';
import { sendSuccess } from '../middleware/error';

export const adminController = {
  getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { role, search, limit, offset } = req.query;
      const users = userRepository.getAll({
        role: role as string,
        search: search as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      const total = userRepository.count({ role: role as string, search: search as string });
      return sendSuccess(res, { users, total }, 'Users retrieved');
    } catch (err) {
      next(err);
    }
  },

  updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { full_name, phone, role } = req.body;
      const updated = userRepository.update(id, { full_name, phone, role });
      return sendSuccess(res, updated, 'User updated successfully');
    } catch (err) {
      next(err);
    }
  },

  getUserScores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const scores = scoreRepository.getByUserId(id);
      return sendSuccess(res, scores, 'User scores');
    } catch (err) {
      next(err);
    }
  },

  adminUpdateScore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { score, score_date, course_name, notes } = req.body;
      const updated = scoreRepository.adminUpdateScore(id, {
        score: score !== undefined ? Number(score) : undefined,
        scoreDate: score_date,
        courseName: course_name,
        notes,
      });
      return sendSuccess(res, updated, 'Score updated by admin');
    } catch (err) {
      next(err);
    }
  },

  getSubscriptions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, limit, offset } = req.query;
      const subscriptions = subscriptionRepository.getAll({
        status: status as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return sendSuccess(res, subscriptions, 'Subscriptions list');
    } catch (err) {
      next(err);
    }
  }
};
