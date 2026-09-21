"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.charityService = exports.CharityValidationError = void 0;
const charityRepository_1 = require("../repositories/charityRepository");
const donationRepository_1 = require("../repositories/donationRepository");
const types_1 = require("../../../shared/types");
class CharityValidationError extends Error {
    errorCode;
    constructor(message, errorCode = 'CHARITY_ERROR') {
        super(message);
        this.errorCode = errorCode;
        this.name = 'CharityValidationError';
    }
}
exports.CharityValidationError = CharityValidationError;
exports.charityService = {
    getDirectory(options) {
        return charityRepository_1.charityRepository.getAll(options);
    },
    getCharityById(id) {
        const charity = charityRepository_1.charityRepository.getById(id);
        if (!charity) {
            throw new CharityValidationError('Charity not found.', 'CHARITY_NOT_FOUND');
        }
        return charity;
    },
    getUserCharitySelection(userId) {
        return charityRepository_1.charityRepository.getUserCharity(userId);
    },
    setUserCharitySelection(userId, charityId, percentage = types_1.MIN_CHARITY_PERCENTAGE) {
        // 1. Verify charity exists
        const charity = charityRepository_1.charityRepository.getById(charityId);
        if (!charity || !charity.is_active) {
            throw new CharityValidationError('Selected charity does not exist or is inactive.', 'INVALID_CHARITY');
        }
        // 2. Validate percentage (min 10%, max 100%)
        const numPct = Number(percentage);
        if (isNaN(numPct) || numPct < types_1.MIN_CHARITY_PERCENTAGE) {
            throw new CharityValidationError(`Charity contribution percentage must be at least ${types_1.MIN_CHARITY_PERCENTAGE}%.`, 'PERCENTAGE_TOO_LOW');
        }
        if (numPct > 100) {
            throw new CharityValidationError('Charity contribution percentage cannot exceed 100%.', 'PERCENTAGE_TOO_HIGH');
        }
        return charityRepository_1.charityRepository.setUserCharity(userId, charityId, Math.floor(numPct));
    },
    createIndependentDonation(data) {
        const charity = charityRepository_1.charityRepository.getById(data.charityId);
        if (!charity) {
            throw new CharityValidationError('Charity not found.', 'CHARITY_NOT_FOUND');
        }
        if (!data.amountCents || data.amountCents <= 0) {
            throw new CharityValidationError('Donation amount must be greater than zero.', 'INVALID_DONATION_AMOUNT');
        }
        return donationRepository_1.donationRepository.create({
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
    adminCreateCharity(data) {
        if (!data.name || !data.mission || !data.description) {
            throw new CharityValidationError('Name, mission, and description are required.', 'MISSING_FIELDS');
        }
        const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const existing = charityRepository_1.charityRepository.getBySlug(slug);
        if (existing) {
            throw new CharityValidationError('A charity with this slug or name already exists.', 'DUPLICATE_CHARITY');
        }
        return charityRepository_1.charityRepository.create({
            ...data,
            slug,
        });
    },
    adminUpdateCharity(id, data) {
        const existing = charityRepository_1.charityRepository.getById(id);
        if (!existing) {
            throw new CharityValidationError('Charity not found.', 'CHARITY_NOT_FOUND');
        }
        const updated = charityRepository_1.charityRepository.update(id, data);
        if (!updated) {
            throw new CharityValidationError('Failed to update charity.', 'UPDATE_FAILED');
        }
        return updated;
    },
    adminDeleteCharity(id) {
        const existing = charityRepository_1.charityRepository.getById(id);
        if (!existing) {
            throw new CharityValidationError('Charity not found.', 'CHARITY_NOT_FOUND');
        }
        return charityRepository_1.charityRepository.delete(id);
    }
};
