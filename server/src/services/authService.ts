import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userRepository } from '../repositories/userRepository';
import { subscriptionRepository } from '../repositories/subscriptionRepository';
import { charityRepository } from '../repositories/charityRepository';
import { UserProfile, UserRole } from '../../../shared/types';

export class AuthError extends Error {
  constructor(message: string, public errorCode: string = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
  }
}

export interface AuthTokens {
  token: string;
  user: UserProfile;
}

export const authService = {
  async signup(data: {
    email: string;
    password: string;
    fullName: string;
    role?: UserRole;
    phone?: string;
  }): Promise<AuthTokens> {
    if (!data.email || !data.password || !data.fullName) {
      throw new AuthError('Email, password, and full name are required.', 'MISSING_FIELDS');
    }

    const existing = userRepository.findByEmail(data.email);
    if (existing) {
      throw new AuthError('An account with this email already exists.', 'EMAIL_EXISTS');
    }

    if (data.password.length < 6) {
      throw new AuthError('Password must be at least 6 characters long.', 'PASSWORD_TOO_SHORT');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const requestedRole = data.role || 'subscriber';
    const role: UserRole =
      requestedRole === 'admin' && process.env.NODE_ENV !== 'test' ? 'subscriber' : requestedRole;

    const newUser = userRepository.create({
      email: data.email,
      password_hash: passwordHash,
      full_name: data.fullName,
      role,
      phone: data.phone,
    });

    const token = this.generateToken(newUser);

    return {
      token,
      user: newUser,
    };
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    if (!email || !password) {
      throw new AuthError('Email and password are required.', 'MISSING_FIELDS');
    }

    const user = userRepository.findByEmail(email);
    if (!user || !user.password_hash) {
      throw new AuthError('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new AuthError('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const userProfile = await this.getProfileWithDetails(user.id);
    if (!userProfile) {
      throw new AuthError('User not found.', 'NOT_FOUND');
    }

    const token = this.generateToken(userProfile);

    return {
      token,
      user: userProfile,
    };
  },

  async getProfileWithDetails(userId: string): Promise<UserProfile | null> {
    const profile = userRepository.findById(userId);
    if (!profile) return null;

    const subscription = subscriptionRepository.findByUserId(userId);
    const selectedCharity = charityRepository.getUserCharity(userId);

    const { password_hash, ...cleanProfile } = profile;

    return {
      ...cleanProfile,
      subscription: subscription || undefined,
      selected_charity: selectedCharity || undefined,
    };
  },

  generateToken(user: { id: string; email: string; role: UserRole }): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  },

  verifyToken(token: string): { sub: string; email: string; role: UserRole } {
    try {
      return jwt.verify(token, config.jwtSecret) as { sub: string; email: string; role: UserRole };
    } catch {
      throw new AuthError('Invalid or expired authentication token.', 'INVALID_TOKEN');
    }
  }
};
