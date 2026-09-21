import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { analyticsRepository } from '../repositories/analyticsRepository';
import { sendSuccess } from '../middleware/error';
import { db } from '../db';

export const analyticsController = {
  getOverview(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const overview = analyticsRepository.getOverviewMetrics();
      const charityBreakdown = analyticsRepository.getCharityImpactBreakdown();
      const activity = analyticsRepository.getRecentActivity();

      // Score distribution histogram (bins 1-10, 11-20, 21-30, 31-40, 41-45)
      const scores = db.prepare('SELECT score FROM scores').all() as { score: number }[];
      const bins = [
        { bin: '1-10', count: 0 },
        { bin: '11-20', count: 0 },
        { bin: '21-30', count: 0 },
        { bin: '31-35', count: 0 },
        { bin: '36-40', count: 0 },
        { bin: '41-45', count: 0 },
      ];

      for (const s of scores) {
        if (s.score <= 10) bins[0].count++;
        else if (s.score <= 20) bins[1].count++;
        else if (s.score <= 30) bins[2].count++;
        else if (s.score <= 35) bins[3].count++;
        else if (s.score <= 40) bins[4].count++;
        else bins[5].count++;
      }

      return sendSuccess(res, {
        metrics: overview,
        charityBreakdown,
        activity,
        scoreDistribution: bins,
      }, 'Analytics overview');
    } catch (err) {
      next(err);
    }
  }
};
