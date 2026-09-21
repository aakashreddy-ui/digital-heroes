import { Router } from 'express';
import authRoutes from './authRoutes';
import scoreRoutes from './scoreRoutes';
import charityRoutes from './charityRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import drawRoutes from './drawRoutes';
import winnerRoutes from './winnerRoutes';
import donationRoutes from './donationRoutes';
import adminRoutes from './adminRoutes';
import analyticsRoutes from './analyticsRoutes';
import { authController } from '../controllers/authController';
import { requireAuthentication } from '../middleware/auth';

const router = Router();

router.use('/auth', authRoutes);
router.get('/profile', requireAuthentication, authController.getMe);
router.put('/profile', requireAuthentication, authController.updateProfile);
router.use('/scores', scoreRoutes);
router.use('/charities', charityRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/draws', drawRoutes);
router.use('/winners', winnerRoutes);
router.use('/donations', donationRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/analytics', analyticsRoutes);

// System health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default router;
