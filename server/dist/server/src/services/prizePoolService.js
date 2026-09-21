"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prizePoolService = exports.SUBSCRIBER_PRIZE_CONTRIBUTION_CENTS = void 0;
const types_1 = require("../../../shared/types");
// Default contribution per active subscriber per month towards the prize pool in integer cents ($10.00 = 1000 cents)
exports.SUBSCRIBER_PRIZE_CONTRIBUTION_CENTS = 1000;
exports.prizePoolService = {
    /**
     * Calculates total prize pool from active subscribers + jackpot rollover.
     * All values in integer cents.
     */
    calculatePrizePool(activeSubscriberCount, rolloverInCents = 0) {
        const safeCount = Math.max(0, activeSubscriberCount);
        const subscriberContributionCents = safeCount * exports.SUBSCRIBER_PRIZE_CONTRIBUTION_CENTS;
        const safeRollover = Math.max(0, Math.floor(rolloverInCents));
        const totalPoolCents = subscriberContributionCents + safeRollover;
        return {
            subscriberContributionCents,
            totalPoolCents,
            rolloverInCents: safeRollover,
        };
    },
    /**
     * Calculates amounts allocated to each tier:
     * Tier 5 (5-number match) = 40% of subscriber pool + rolloverInCents
     * Tier 4 (4-number match) = 35% of subscriber pool
     * Tier 3 (3-number match) = 25% of subscriber pool
     */
    calculateTierAmounts(subscriberContributionCents, rolloverInCents = 0) {
        const tier5Base = Math.floor(subscriberContributionCents * types_1.TIER_5_PERCENTAGE);
        const tier4Pool = Math.floor(subscriberContributionCents * types_1.TIER_4_PERCENTAGE);
        const tier3Pool = Math.floor(subscriberContributionCents * types_1.TIER_3_PERCENTAGE);
        // 5-match jackpot includes previous rollover
        const tier5Pool = tier5Base + rolloverInCents;
        return {
            tier5PoolCents: tier5Pool,
            tier4PoolCents: tier4Pool,
            tier3PoolCents: tier3Pool,
        };
    },
    /**
     * Calculates payout per winner in a tier. Multiple winners split the tier pot equally.
     * Integer cents only (floored).
     */
    calculateWinnerShare(tierPoolCents, winnerCount) {
        if (winnerCount <= 0)
            return 0;
        return Math.floor(tierPoolCents / winnerCount);
    },
    /**
     * Calculates jackpot rollover to next month.
     * If tier 5 has 0 winners, the entire tier 5 pool rolls over to next month's jackpot.
     * Tier 4 and Tier 3 do NOT roll over.
     */
    calculateJackpotRollover(tier5PoolCents, tier5WinnerCount) {
        if (tier5WinnerCount === 0) {
            return tier5PoolCents;
        }
        return 0;
    },
    /**
     * Computes complete prize distribution for a draw given winner counts.
     */
    calculateFullDistribution(activeSubscriberCount, rolloverInCents, winnerCounts) {
        const pool = this.calculatePrizePool(activeSubscriberCount, rolloverInCents);
        const tiers = this.calculateTierAmounts(pool.subscriberContributionCents, pool.rolloverInCents);
        const tier5Payout = this.calculateWinnerShare(tiers.tier5PoolCents, winnerCounts.tier5);
        const tier4Payout = this.calculateWinnerShare(tiers.tier4PoolCents, winnerCounts.tier4);
        const tier3Payout = this.calculateWinnerShare(tiers.tier3PoolCents, winnerCounts.tier3);
        const rolloverOutCents = this.calculateJackpotRollover(tiers.tier5PoolCents, winnerCounts.tier5);
        return {
            totalPoolCents: pool.totalPoolCents,
            subscriberContributionCents: pool.subscriberContributionCents,
            rolloverInCents: pool.rolloverInCents,
            tier5PoolCents: tiers.tier5PoolCents,
            tier4PoolCents: tiers.tier4PoolCents,
            tier3PoolCents: tiers.tier3PoolCents,
            tier5PayoutPerWinnerCents: tier5Payout,
            tier4PayoutPerWinnerCents: tier4Payout,
            tier3PayoutPerWinnerCents: tier3Payout,
            rolloverOutCents,
        };
    }
};
