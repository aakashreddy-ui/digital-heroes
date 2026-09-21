import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { donationRepository } from '../repositories/donationRepository';
import { sendSuccess } from '../middleware/error';
import { donationSchema, validate } from '../validators';
import { donationService } from '../services/donationService';

export const donationController = {
  async createDonation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { charity_id, amount_cents, frequency, donor_name, donor_email } = validate(donationSchema, req.body);
      const checkout = await donationService.createCheckout({
        userId,
        donorName: donor_name,
        donorEmail: donor_email,
        charityId: charity_id,
        amountCents: Number(amount_cents),
        frequency,
      });
      return sendSuccess(res, checkout, checkout.simulated ? 'Independent donation created successfully' : 'Donation checkout created', 201);
    } catch (err) {
      next(err);
    }
  },

  getUserDonations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const donations = donationRepository.getByUserId(userId);
      return sendSuccess(res, donations, 'User donations');
    } catch (err) {
      next(err);
    }
  },

  getAllDonations(_req: Request, res: Response, next: NextFunction) {
    try {
      const donations = donationRepository.getAll();
      return sendSuccess(res, donations, 'All independent donations');
    } catch (err) {
      next(err);
    }
  }
};
