import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { drawRepository } from '../repositories/drawRepository';
import { drawEngineService } from '../services/drawEngineService';
import { sendSuccess } from '../middleware/error';

export const drawController = {
  getUpcoming(req: Request, res: Response, next: NextFunction) {
    try {
      const draw = drawRepository.getUpcomingDraw();
      return sendSuccess(res, draw, 'Upcoming draw');
    } catch (err) {
      next(err);
    }
  },

  getLatestPublished(req: Request, res: Response, next: NextFunction) {
    try {
      const draw = drawRepository.getLatestPublishedDraw();
      return sendSuccess(res, draw, 'Latest published draw');
    } catch (err) {
      next(err);
    }
  },

  getAllDraws(req: Request, res: Response, next: NextFunction) {
    try {
      const draws = drawRepository.getAll();
      return sendSuccess(res, draws, 'All draws');
    } catch (err) {
      next(err);
    }
  },

  getDrawById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const draw = drawRepository.getById(id);
      if (!draw) {
        return res.status(404).json({ success: false, message: 'Draw not found', errorCode: 'NOT_FOUND', data: null });
      }
      return sendSuccess(res, draw, 'Draw details');
    } catch (err) {
      next(err);
    }
  },

  getUserEntries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const entries = drawRepository.getUserEntries(userId);
      return sendSuccess(res, entries, 'User draw entries');
    } catch (err) {
      next(err);
    }
  },

  // Admin endpoints
  adminCreateDraw(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { draw_date, month_year, method, jackpot_rollover_cents } = req.body;
      const draw = drawRepository.createDraw({
        drawDate: draw_date,
        monthYear: month_year,
        method,
        jackpotRolloverCents: jackpot_rollover_cents,
      });
      return sendSuccess(res, draw, 'Draw created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  adminSimulateDraw(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { method, custom_numbers } = req.body;
      const simulation = drawEngineService.simulateDraw(id, method, custom_numbers);
      return sendSuccess(res, simulation, 'Simulation completed');
    } catch (err) {
      next(err);
    }
  },

  adminPublishDraw(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const adminId = req.user!.id;
      const published = drawEngineService.publishDraw(id, adminId);
      return sendSuccess(res, published, 'Draw published successfully');
    } catch (err) {
      next(err);
    }
  }
};
