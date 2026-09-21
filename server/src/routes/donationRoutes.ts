import { Router } from 'express';
import { donationController } from '../controllers/donationController';
import { optionalAuthentication, requireAdmin, requireAuthentication } from '../middleware/auth';

const router = Router();

// Independent donation (guest or logged-in user)
router.post('/', optionalAuthentication, donationController.createDonation);
router.get('/user', requireAuthentication, donationController.getUserDonations);
router.get('/', requireAdmin, donationController.getAllDonations);

export default router;
