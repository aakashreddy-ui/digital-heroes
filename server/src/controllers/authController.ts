import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { sendSuccess } from '../middleware/error';
import { AuthenticatedRequest } from '../middleware/auth';
import { userRepository } from '../repositories/userRepository';
import { loginSchema, signupSchema, validate } from '../validators';

export const authController = {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, full_name, phone } = validate(signupSchema, req.body);
      const role = req.body.role;
      const result = await authService.signup({
        email,
        password,
        fullName: full_name,
        role,
        phone,
      });
      return sendSuccess(res, result, 'Registration successful', 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = validate(loginSchema, req.body);
      const result = await authService.login(email, password);
      return sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async logout(_req: Request, res: Response) {
    return sendSuccess(res, null, 'Logged out successfully');
  },

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized', errorCode: 'UNAUTHORIZED', data: null });
      }
      const profile = await authService.getProfileWithDetails(req.user.id);
      if (!profile) {
        return res.status(404).json({ success: false, message: 'User not found', errorCode: 'NOT_FOUND', data: null });
      }
      return sendSuccess(res, profile, 'Profile retrieved');
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized', errorCode: 'UNAUTHORIZED', data: null });
      }
      const { full_name, phone, avatar_url } = req.body;
      const updated = userRepository.update(req.user.id, { full_name, phone, avatar_url });
      const enriched = await authService.getProfileWithDetails(req.user.id);
      return sendSuccess(res, enriched, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }
};
