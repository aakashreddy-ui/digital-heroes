"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = exports.SubscriptionError = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("../config");
const subscriptionRepository_1 = require("../repositories/subscriptionRepository");
const userRepository_1 = require("../repositories/userRepository");
const types_1 = require("../../../shared/types");
const donationService_1 = require("./donationService");
const stripe = config_1.config.stripeSecretKey
    ? new stripe_1.default(config_1.config.stripeSecretKey, { apiVersion: '2025-02-24.acacia' })
    : null;
class SubscriptionError extends Error {
    errorCode;
    constructor(message, errorCode = 'SUBSCRIPTION_ERROR') {
        super(message);
        this.errorCode = errorCode;
        this.name = 'SubscriptionError';
    }
}
exports.SubscriptionError = SubscriptionError;
exports.subscriptionService = {
    getUserSubscription(userId) {
        return subscriptionRepository_1.subscriptionRepository.findByUserId(userId);
    },
    isSubscriptionActive(userId) {
        const sub = subscriptionRepository_1.subscriptionRepository.findByUserId(userId);
        return sub !== null && sub.status === 'active';
    },
    /**
     * Creates a checkout session.
     * If Stripe secret key is configured, creates a real Stripe Checkout Session.
     * If not configured, provides a seamless simulated checkout URL for instant testing.
     */
    async createCheckoutSession(userId, planId, successUrl, cancelUrl) {
        const user = userRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new SubscriptionError('User not found', 'USER_NOT_FOUND');
        }
        const plan = types_1.SUBSCRIPTION_PLANS.find(p => p.id === planId);
        if (!plan) {
            throw new SubscriptionError('Invalid subscription plan', 'INVALID_PLAN');
        }
        const clientSuccessUrl = successUrl || `${config_1.config.clientUrl}/dashboard/subscription?status=success`;
        const clientCancelUrl = cancelUrl || `${config_1.config.clientUrl}/pricing?status=cancelled`;
        if (stripe) {
            try {
                const stripePriceId = planId === 'monthly' ? config_1.config.stripeMonthlyPriceId : config_1.config.stripeYearlyPriceId;
                if (config_1.config.nodeEnv === 'production' && !stripePriceId) {
                    throw new SubscriptionError(`Stripe price ID is missing for the ${planId} plan.`, 'STRIPE_PRICE_NOT_CONFIGURED');
                }
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    mode: 'subscription',
                    customer_email: user.email,
                    line_items: [{
                            ...(stripePriceId ? { price: stripePriceId } : {
                                price_data: {
                                    currency: 'usd',
                                    product_data: { name: plan.name, description: plan.description },
                                    unit_amount: plan.price_cents,
                                    recurring: { interval: plan.billing_interval },
                                },
                            }),
                            quantity: 1,
                        }],
                    client_reference_id: userId,
                    metadata: {
                        userId,
                        planId,
                    },
                    success_url: `${clientSuccessUrl}&session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: clientCancelUrl,
                });
                return {
                    checkoutUrl: session.url || clientSuccessUrl,
                    sessionId: session.id,
                    simulated: false,
                };
            }
            catch (err) {
                throw new SubscriptionError(`Stripe checkout failed: ${err.message}`, 'STRIPE_CHECKOUT_FAILED');
            }
        }
        if (!config_1.config.stripeSimulatorEnabled) {
            throw new SubscriptionError('Stripe checkout is not configured.', 'STRIPE_NOT_CONFIGURED');
        }
        // Simulated Checkout (Instant Test Mode)
        const simulatedSessionId = `sim_cs_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        return {
            checkoutUrl: `${clientSuccessUrl}&session_id=${simulatedSessionId}&simulated=true&plan=${planId}`,
            sessionId: simulatedSessionId,
            simulated: true,
        };
    },
    /**
     * Activates or updates subscription upon successful checkout.
     */
    activateSubscription(userId, planId, stripeCustomerId, stripeSubscriptionId) {
        const now = new Date();
        const periodEnd = new Date(now);
        if (planId === 'yearly') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }
        else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
        return subscriptionRepository_1.subscriptionRepository.upsert({
            userId,
            planId,
            status: 'active',
            stripeCustomerId,
            stripeSubscriptionId,
            currentPeriodStart: now.toISOString(),
            currentPeriodEnd: periodEnd.toISOString(),
            cancelAtPeriodEnd: false,
        });
    },
    /**
     * Cancels a subscription at end of period or immediately.
     */
    async cancelSubscription(userId, immediate = false) {
        const sub = subscriptionRepository_1.subscriptionRepository.findByUserId(userId);
        if (!sub) {
            throw new SubscriptionError('No active subscription found', 'NO_SUBSCRIPTION');
        }
        if (sub.stripe_subscription_id && stripe) {
            try {
                if (immediate) {
                    await stripe.subscriptions.cancel(sub.stripe_subscription_id);
                }
                else {
                    await stripe.subscriptions.update(sub.stripe_subscription_id, {
                        cancel_at_period_end: true,
                    });
                }
            }
            catch (err) {
                console.warn('Stripe cancel error:', err.message);
            }
        }
        const updatedStatus = immediate ? 'cancelled' : sub.status;
        const cancelAtEnd = !immediate;
        const updated = subscriptionRepository_1.subscriptionRepository.updateStatus(userId, updatedStatus, cancelAtEnd);
        if (!updated) {
            throw new SubscriptionError('Failed to cancel subscription', 'UPDATE_FAILED');
        }
        return updated;
    },
    /**
     * Handles Stripe Webhook events.
     */
    async handleWebhook(rawBody, signature) {
        if (!stripe || !config_1.config.stripeWebhookSecret) {
            if (config_1.config.stripeSimulatorEnabled)
                return { received: true };
            throw new SubscriptionError('Stripe webhook is not configured.', 'STRIPE_NOT_CONFIGURED');
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(rawBody, signature, config_1.config.stripeWebhookSecret);
        }
        catch (err) {
            throw new SubscriptionError(`Webhook signature verification failed: ${err.message}`, 'INVALID_SIGNATURE');
        }
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.mode === 'payment' && session.metadata?.donationType === 'independent') {
                    donationService_1.donationService.recordCompletedCheckout(session);
                    break;
                }
                const userId = session.client_reference_id || session.metadata?.userId;
                const planId = session.metadata?.planId || 'monthly';
                if (userId) {
                    this.activateSubscription(userId, planId, session.customer, session.subscription);
                }
                break;
            }
            case 'customer.subscription.updated': {
                const stripeSub = event.data.object;
                const sub = subscriptionRepository_1.subscriptionRepository.findByStripeSubscriptionId(stripeSub.id);
                if (sub) {
                    const status = stripeSub.status === 'active' ? 'active' :
                        stripeSub.status === 'past_due' ? 'past_due' :
                            stripeSub.status === 'incomplete' ? 'incomplete' :
                                stripeSub.status === 'unpaid' ? 'inactive' :
                                    'cancelled';
                    subscriptionRepository_1.subscriptionRepository.updateStatus(sub.user_id, status, stripeSub.cancel_at_period_end);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const stripeSub = event.data.object;
                const sub = subscriptionRepository_1.subscriptionRepository.findByStripeSubscriptionId(stripeSub.id);
                if (sub) {
                    subscriptionRepository_1.subscriptionRepository.updateStatus(sub.user_id, 'cancelled', false);
                }
                break;
            }
        }
        return { received: true };
    }
};
