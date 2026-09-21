"use strict";
// ==========================================
// DIGITAL HEROES SHARED TYPES & CONSTANTS
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_PLANS = exports.TIER_3_PERCENTAGE = exports.TIER_4_PERCENTAGE = exports.TIER_5_PERCENTAGE = exports.MIN_CHARITY_PERCENTAGE = exports.MAX_STORED_SCORES = exports.SCORE_MAX = exports.SCORE_MIN = void 0;
// Constants
exports.SCORE_MIN = 1;
exports.SCORE_MAX = 45;
exports.MAX_STORED_SCORES = 5;
exports.MIN_CHARITY_PERCENTAGE = 10;
// Prize Pool Percentages
exports.TIER_5_PERCENTAGE = 0.40; // 40%
exports.TIER_4_PERCENTAGE = 0.35; // 35%
exports.TIER_3_PERCENTAGE = 0.25; // 25%
// Plans
exports.SUBSCRIPTION_PLANS = [
    {
        id: 'monthly',
        name: 'Digital Hero Monthly',
        price_cents: 2500, // $25.00 / month
        billing_interval: 'month',
        description: 'Full access to Stableford score tracking, monthly draws, and charitable impact.',
        features: [
            'Enter & track latest 5 Stableford scores',
            'Automatic entry into monthly cash draws',
            'Min 10% directly funds your chosen charity',
            'Eligible for 5-number, 4-number & 3-number prizes',
            'Full subscriber analytics and charity reports',
        ],
    },
    {
        id: 'yearly',
        name: 'Digital Hero Yearly',
        price_cents: 25000, // $250.00 / year (save $50, ~2 months free)
        billing_interval: 'year',
        description: 'Year-round impact and draw participation with 2 months free.',
        features: [
            'All Monthly Plan features included',
            'Save $50 with annual billing (2 months free)',
            'Guaranteed 12 monthly draw entries',
            'Priority winner verification and payout',
            'Dedicated Hero Patron badge in charity leaderboards',
        ],
    },
];
