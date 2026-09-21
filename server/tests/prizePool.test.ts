import { describe, it, expect } from 'vitest';
import { prizePoolService, SUBSCRIBER_PRIZE_CONTRIBUTION_CENTS } from '../src/services/prizePoolService';

describe('Prize Pool Calculations and Rollover Engine', () => {
  it('calculates total prize pool accurately based on active subscriber count in integer cents', () => {
    // 100 subscribers, $10.00 each = 1,000 cents * 100 = 100,000 cents ($1,000.00)
    const pool = prizePoolService.calculatePrizePool(100, 0);
    expect(pool.subscriberContributionCents).toBe(100000);
    expect(pool.totalPoolCents).toBe(100000);
    expect(pool.rolloverInCents).toBe(0);
  });

  it('allocates strictly 40% to tier 5, 35% to tier 4, and 25% to tier 3', () => {
    const subscriberContrib = 100000; // $1,000.00
    const tiers = prizePoolService.calculateTierAmounts(subscriberContrib, 0);

    expect(tiers.tier5PoolCents).toBe(40000); // 40% = $400.00
    expect(tiers.tier4PoolCents).toBe(35000); // 35% = $350.00
    expect(tiers.tier3PoolCents).toBe(25000); // 25% = $250.00

    expect(tiers.tier5PoolCents + tiers.tier4PoolCents + tiers.tier3PoolCents).toBe(subscriberContrib);
  });

  it('adds jackpot rollover exclusively to tier 5 (5-number match)', () => {
    const subscriberContrib = 100000;
    const rolloverIn = 25000; // $250.00 prior rollover
    const tiers = prizePoolService.calculateTierAmounts(subscriberContrib, rolloverIn);

    expect(tiers.tier5PoolCents).toBe(40000 + 25000); // 65,000 cents ($650.00)
    expect(tiers.tier4PoolCents).toBe(35000); // unaffected by rollover
    expect(tiers.tier3PoolCents).toBe(25000); // unaffected by rollover
  });

  it('splits tier prize equally among multiple winners in integer cents without fractional cents', () => {
    const tierPool = 100000; // 100,000 cents
    // 3 winners: 100000 / 3 = 33,333 cents each
    const share3 = prizePoolService.calculateWinnerShare(tierPool, 3);
    expect(share3).toBe(33333);

    // 4 winners: 100000 / 4 = 25,000 cents each
    const share4 = prizePoolService.calculateWinnerShare(tierPool, 4);
    expect(share4).toBe(25000);

    // 0 winners: returns 0
    const share0 = prizePoolService.calculateWinnerShare(tierPool, 0);
    expect(share0).toBe(0);
  });

  it('rolls over the 5-number jackpot if unclaimed, while 4-number and 3-number prizes do NOT roll over', () => {
    const fullDistUnclaimed = prizePoolService.calculateFullDistribution(
      100, // 100 active subscribers
      5000, // 5000 cents rollover in
      { tier5: 0, tier4: 2, tier3: 5 } // 0 winners in tier 5
    );

    // Tier 5 pool (40,000 + 5,000 = 45,000) rolls over to next month
    expect(fullDistUnclaimed.rolloverOutCents).toBe(45000);
    expect(fullDistUnclaimed.tier5PayoutPerWinnerCents).toBe(0);
    // Tier 4 (35,000 / 2 = 17,500)
    expect(fullDistUnclaimed.tier4PayoutPerWinnerCents).toBe(17500);

    // When tier 5 IS claimed:
    const fullDistClaimed = prizePoolService.calculateFullDistribution(
      100,
      5000,
      { tier5: 1, tier4: 2, tier3: 5 } // 1 winner in tier 5
    );

    expect(fullDistClaimed.rolloverOutCents).toBe(0);
    expect(fullDistClaimed.tier5PayoutPerWinnerCents).toBe(45000);
  });
});
