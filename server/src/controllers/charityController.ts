import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { charityService } from '../services/charityService';
import { sendSuccess } from '../middleware/error';
import { charitySelectionSchema, validate } from '../validators';

export const charityController = {
  getDirectory(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, search, featured } = req.query;
      const charities = charityService.getDirectory({
        category: category as string,
        search: search as string,
        featuredOnly: featured === 'true',
      });
      return sendSuccess(res, charities, 'Charities retrieved');
    } catch (err) {
      next(err);
    }
  },

  getCharity(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const charity = charityService.getCharityById(id);
      return sendSuccess(res, charity, 'Charity retrieved');
    } catch (err) {
      next(err);
    }
  },

  getUserCharity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const selection = charityService.getUserCharitySelection(userId);
      return sendSuccess(res, selection, 'User charity selection');
    } catch (err) {
      next(err);
    }
  },

  setUserCharity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { charity_id, contribution_percentage } = validate(charitySelectionSchema, req.body);
      const selection = charityService.setUserCharitySelection(
        userId,
        charity_id,
        contribution_percentage
      );
      return sendSuccess(res, selection, 'Charity selection updated');
    } catch (err) {
      next(err);
    }
  },

  // Admin
  createCharity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const charity = charityService.adminCreateCharity(req.body);
      return sendSuccess(res, charity, 'Charity created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  updateCharity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const updated = charityService.adminUpdateCharity(id, req.body);
      return sendSuccess(res, updated, 'Charity updated successfully');
    } catch (err) {
      next(err);
    }
  },

  deleteCharity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      charityService.adminDeleteCharity(id);
      return sendSuccess(res, { id }, 'Charity deleted successfully');
    } catch (err) {
      next(err);
    }
  }
};
