import Stripe from 'stripe';
import { config } from '../config';
import { charityRepository } from '../repositories/charityRepository';
import { donationRepository } from '../repositories/donationRepository';
import { charityService, CharityValidationError } from './charityService';
import { IndependentDonation } from '../../../shared/types';

const stripe = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, { apiVersion: '2025-02-24.acacia' as any })
  : null;

export class DonationError extends Error {
  constructor(message: string, public errorCode = 'DONATION_ERROR') {
    super(message);
    this.name = 'DonationError';
  }
}

export interface DonationInput {
  userId?: string;
  donorName?: string;
  donorEmail?: string;
  charityId: string;
  amountCents: number;
  frequency?: 'one_off' | 'monthly';
}

export const donationService = {
  async createCheckout(input: DonationInput): Promise<{ checkoutUrl: string; sessionId?: string; simulated?: boolean; donation?: IndependentDonation }> {
    const charity = charityRepository.getById(input.charityId);
    if (!charity || !charity.is_active) throw new CharityValidationError('Charity not found.', 'CHARITY_NOT_FOUND');
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw new DonationError('Donation amount must be greater than zero.', 'INVALID_DONATION_AMOUNT');
    }

    if (!stripe) {
      if (!config.stripeSimulatorEnabled) throw new DonationError('Stripe payments are not configured.', 'STRIPE_NOT_CONFIGURED');
      const donation = charityService.createIndependentDonation(input);
      return { checkoutUrl: `${config.clientUrl}/charities/${charity.id}?donation=success&simulated=true`, simulated: true, donation };
    }

    const successUrl = `${config.clientUrl}/charities/${charity.id}?donation=success`;
    const cancelUrl = `${config.clientUrl}/charities/${charity.id}?donation=cancelled`;
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

  recordCompletedCheckout(session: Stripe.Checkout.Session): IndependentDonation | null {
    if (session.metadata?.donationType !== 'independent') return null;
    const charityId = session.metadata.charityId;
    const amountCents = Number(session.metadata.amountCents);
    if (!charityId || !Number.isInteger(amountCents) || amountCents <= 0) {
      throw new DonationError('Donation checkout metadata is invalid.', 'INVALID_CHECKOUT_METADATA');
    }

    const existing = donationRepository.getAll().find(d => d.stripe_payment_intent_id === String(session.payment_intent || ''));
    if (existing) return existing;

    return donationRepository.create({
      userId: session.metadata.userId || undefined,
      donorName: session.metadata.donorName || undefined,
      donorEmail: session.metadata.donorEmail || session.customer_details?.email || undefined,
      charityId,
      amountCents,
      frequency: (session.metadata.frequency as 'one_off' | 'monthly') || 'one_off',
      stripePaymentIntentId: session.payment_intent ? String(session.payment_intent) : undefined,
      status: 'succeeded',
    });
  },
};
