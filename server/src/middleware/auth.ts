import { Request, Response, NextFunction } from 'express';
import { authService, AuthError } from '../services/authService';
import { subscriptionService } from '../services/subscriptionService';
import { UserRole } from '../../../shared/types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export function requireAuthentication(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Missing or invalid Authorization header.',
      errorCode: 'UNAUTHORIZED',
      data: null,
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = authService.verifyToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: err.message || 'Invalid or expired session token.',
      errorCode: 'INVALID_TOKEN',
      data: null,
    });
  }
}

export function requireSubscriber(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuthentication(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errorCode: 'UNAUTHORIZED',
        data: null,
      });
    }

    // Admins always have access
    if (req.user.role === 'admin') {
      return next();
    }

    const isActive = subscriptionService.isSubscriptionActive(req.user.id);
    if (!isActive) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required to perform this action.',
        errorCode: 'SUBSCRIPTION_REQUIRED',
        data: null,
      });
    }

    next();
  });
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuthentication(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Administrator privileges required.',
        errorCode: 'FORBIDDEN',
        data: null,
      });
    }
    next();
  });
}

export function optionalAuthentication(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = authService.verifyToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}
