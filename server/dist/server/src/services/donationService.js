"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.donationService = exports.DonationError = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("../config");
const charityRepository_1 = require("../repositories/charityRepository");
const donationRepository_1 = require("../repositories/donationRepository");
const charityService_1 = require("./charityService");
const stripe = config_1.config.stripeSecretKey
    ? new stripe_1.default(config_1.config.stripeSecretKey, { apiVersion: '2025-02-24.acacia' })
    : null;
class DonationError extends Error {
    errorCode;
    constructor(message, errorCode = 'DONATION_ERROR') {
        super(message);
        this.errorCode = errorCode;
        this.name = 'DonationError';
    }
}
exports.DonationError = DonationError;
exports.donationService = {
    async createCheckout(input) {
        const charity = charityRepository_1.charityRepository.getById(input.charityId);
        if (!charity || !charity.is_active)
            throw new charityService_1.CharityValidationError('Charity not found.', 'CHARITY_NOT_FOUND');
        if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
            throw new DonationError('Donation amount must be greater than zero.', 'INVALID_DONATION_AMOUNT');
        }
        if (!stripe) {
            if (!config_1.config.stripeSimulatorEnabled)
                throw new DonationError('Stripe payments are not configured.', 'STRIPE_NOT_CONFIGURED');
            const donation = charityService_1.charityService.createIndependentDonation(input);
            return { checkoutUrl: `${config_1.config.clientUrl}/charities/${charity.id}?donation=success&simulated=true`, simulated: true, donation };
        }
        const successUrl = `${config_1.config.clientUrl}/charities/${charity.id}?donation=success`;
        const cancelUrl = `${config_1.config.clientUrl}/charities/${charity.id}?donation=cancelled`;
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: input.donorEmail || undefined,
            line_items: [{
                    quantity: 1,
                    price_data: {
                        currency: 'usd',
                        unit_amount: input.amountCents,
                        product_data: { name: `Independent donation to ${charity.name}` },
                    },
                }],
            metadata: {
                donationType: 'independent',
                userId: input.userId || '',
                charityId: input.charityId,
                amountCents: String(input.amountCents),
                frequency: input.frequency || 'one_off',
                donorName: input.donorName || '',
                donorEmail: input.donorEmail || '',
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
        });
        return { checkoutUrl: session.url || cancelUrl, sessionId: session.id, simulated: false };
    },
    recordCompletedCheckout(session) {
        if (session.metadata?.donationType !== 'independent')
            return null;
        const charityId = session.metadata.charityId;
        const amountCents = Number(session.metadata.amountCents);
        if (!charityId || !Number.isInteger(amountCents) || amountCents <= 0) {
            throw new DonationError('Donation checkout metadata is invalid.', 'INVALID_CHECKOUT_METADATA');
        }
        const existing = donationRepository_1.donationRepository.getAll().find(d => d.stripe_payment_intent_id === String(session.payment_intent || ''));
        if (existing)
            return existing;
        return donationRepository_1.donationRepository.create({
            userId: session.metadata.userId || undefined,
            donorName: session.metadata.donorName || undefined,
            donorEmail: session.metadata.donorEmail || session.customer_details?.email || undefined,
            charityId,
            amountCents,
            frequency: session.metadata.frequency || 'one_off',
            stripePaymentIntentId: session.payment_intent ? String(session.payment_intent) : undefined,
            status: 'succeeded',
        });
    },
};
