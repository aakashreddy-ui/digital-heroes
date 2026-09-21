import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { winnerService } from '../services/winnerService';
import { sendSuccess } from '../middleware/error';

export const winnerController = {
  getUserWinnings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const winnings = winnerService.getUserWinnings(userId);
      return sendSuccess(res, winnings, 'User winnings');
    } catch (err) {
      next(err);
    }
  },

  getWinnerById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const winner = winnerService.getWinnerById(id);
      return sendSuccess(res, winner, 'Winner details');
    } catch (err) {
      next(err);
    }
  },

  async uploadProof(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);
      
      let fileUrl = req.body.proof_url;
      let originalFilename = req.body.file_name || 'scorecard_proof.png';
      let fileType = req.body.file_type || 'image/png';
      let fileSize = req.body.file_size || 0;

      if (req.file) {
        fileUrl = `/uploads/proofs/${req.file.filename}`;
        originalFilename = req.file.originalname;
        fileType = req.file.mimetype;
        fileSize = req.file.size;
      }

      if (!req.file && fileUrl && !fileUrl.startsWith('/uploads/proofs/')) {
        return res.status(400).json({
          success: false,
          message: 'Proof must be uploaded as an image file.',
          errorCode: 'INVALID_PROOF_SOURCE',
          data: null,
        });
      }

      if (!fileUrl) {
        return res.status(400).json({
          success: false,
          message: 'Proof file or proof_url is required.',
          errorCode: 'MISSING_FILE',
          data: null,
        });
      }

      const updated = winnerService.submitProof(userId, id, fileUrl, originalFilename, fileType, fileSize);
      return sendSuccess(res, updated, 'Proof uploaded successfully');
    } catch (err) {
      next(err);
    }
  },

  // Admin endpoints
  adminGetAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { verification_status, payout_status, draw_id } = req.query;
      const winners = winnerService.adminGetAll({
        verificationStatus: verification_status as any,
        payoutStatus: payout_status as any,
        drawId: draw_id as string,
      });
      return sendSuccess(res, winners, 'All winners');
    } catch (err) {
      next(err);
    }
  },

  adminVerify(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const adminId = req.user!.id;
      const { approved, notes } = req.body;
      const result = winnerService.adminVerifyWinner(adminId, id, Boolean(approved), notes);
      return sendSuccess(res, result, `Winner verification ${approved ? 'approved' : 'rejected'}`);
    } catch (err) {
      next(err);
    }
  },

  adminPayout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const adminId = req.user!.id;
      const { payout_reference } = req.body;
      const result = winnerService.adminMarkPayout(adminId, id, payout_reference);
      return sendSuccess(res, result, 'Payout marked as completed');
    } catch (err) {
      next(err);
    }
  }
};
