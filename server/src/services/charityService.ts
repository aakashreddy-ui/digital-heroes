import { charityRepository } from '../repositories/charityRepository';
import { donationRepository } from '../repositories/donationRepository';
import { Charity, UserCharitySelection, MIN_CHARITY_PERCENTAGE, IndependentDonation } from '../../../shared/types';

export class CharityValidationError extends Error {
  constructor(message: string, public errorCode: string = 'CHARITY_ERROR') {
    super(message);
    this.name = 'CharityValidationError';
  }
}

export const charityService = {
  getDirectory(options?: { category?: string; search?: string; featuredOnly?: boolean }): Charity[] {
    return charityRepository.getAll(options);
  },

  getCharityById(id: string): Charity {
    const charity = charityRepository.getById(id);
    if (!charity) {
      throw new CharityValidationError('Charity not found.', 'CHARITY_NOT_FOUND');
    }
    return charity;
  },

  getUserCharitySelection(userId: string): UserCharitySelection | null {
    return charityRepository.getUserCharity(userId);
  },

  setUserCharitySelection(userId: string, charityId: string, percentage: number = MIN_CHARITY_PERCENTAGE): UserCharitySelection {
    // 1. Verify charity exists
    const charity = charityRepository.getById(charityId);
    if (!charity || !charity.is_active) {
      throw new CharityValidationError('Selected charity does not exist or is inactive.', 'INVALID_CHARITY');
    }

    // 2. Validate percentage (min 10%, max 100%)
    const numPct = Number(percentage);
    if (isNaN(numPct) || numPct < MIN_CHARITY_PERCENTAGE) {
      throw new CharityValidationError(
        `Charity contribution percentage must be at least ${MIN_CHARITY_PERCENTAGE}%.`,
        'PERCENTAGE_TOO_LOW'
      );
    }

    if (numPct > 100) {
      throw new CharityValidationError('Charity contribution percentage cannot exceed 100%.', 'PERCENTAGE_TOO_HIGH');
    }

    return charityRepository.setUserCharity(userId, charityId, Math.floor(numPct));
  },

  createIndependentDonation(data: {
    userId?: string;
    donorName?: string;
    donorEmail?: string;
    charityId: string;
    amountCents: number;
    frequency?: 'one_off' | 'monthly';
  }): IndependentDonation {
    const charity = charityRepository.getById(data.charityId);
    if (!charity) {
      throw new CharityValidationError('Charity not found.', 'CHARITY_NOT_FOUND');
    }

    if (!data.amountCents || data.amountCents <= 0) {
      throw new CharityValidationError('Donation amount must be greater than zero.', 'INVALID_DONATION_AMOUNT');
    }

    return donationRepository.create({
      userId: data.userId,
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      charityId: data.charityId,
      amountCents: Math.floor(data.amountCents),
      frequency: data.frequency || 'one_off',
      status: 'succeeded',
    });
  },

  // Admin methods
  adminCreateCharity(data: Omit<Charity, 'id' | 'created_at' | 'updated_at'>): Charity {
    if (!data.name || !data.mission || !data.description) {
      throw new CharityValidationError('Name, mission, and description are required.', 'MISSING_FIELDS');
    }

    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = charityRepository.getBySlug(slug);
    if (existing) {
      throw new CharityValidationError('A charity with this slug or name already exists.', 'DUPLICATE_CHARITY');
    }

    return charityRepository.create({
      ...data,
      slug,
    });
  },

  adminUpdateCharity(id: string, data: Partial<Charity>): Charity {
    const existing = charityRepository.getById(id);
    if (!existing) {
      throw new CharityValidationError('Charity not found.', 'CHARITY_NOT_FOUND');
    }

    const updated = charityRepository.update(id, data);
    if (!updated) {
      throw new CharityValidationError('Failed to update charity.', 'UPDATE_FAILED');
    }

    return updated;
  },

  adminDeleteCharity(id: string): boolean {
    const existing = charityRepository.getById(id);
    if (!existing) {
      throw new CharityValidationError('Charity not found.', 'CHARITY_NOT_FOUND');
    }

    return charityRepository.delete(id);
  }
};
