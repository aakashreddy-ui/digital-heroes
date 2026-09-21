import { db } from '../db';

export const analyticsRepository = {
  getOverviewMetrics() {
    const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM profiles').get() as any).c;
    const activeSubscribers = (db.prepare(`SELECT COUNT(*) as c FROM subscriptions WHERE status = 'active'`).get() as any).c;
    const totalDraws = (db.prepare('SELECT COUNT(*) as c FROM draws').get() as any).c;
    
    // Total prize pool awarded across all completed draws
    const prizeAwardedRow = db.prepare(`
      SELECT SUM(prize_amount_cents) as total FROM winners WHERE verification_status = 'approved'
    `).get() as any;
    const totalPrizeAwardedCents = prizeAwardedRow?.total || 0;

    // Total charity funds generated:
    // 1. From active subscriptions (at minimum 10% of monthly/yearly equivalent)
    const subCharityRow = db.prepare(`
      SELECT SUM((p.price_cents * uc.contribution_percentage) / 100) as total
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      JOIN user_charities uc ON s.user_id = uc.user_id
      WHERE s.status = 'active'
    `).get() as any;
    const subscriptionCharityCents = subCharityRow?.total || 0;

    // 2. From independent donations
    const donationRow = db.prepare(`
      SELECT SUM(amount_cents) as total FROM donations WHERE status = 'succeeded'
    `).get() as any;
    const independentDonationCents = donationRow?.total || 0;

    const totalCharityRaisedCents = subscriptionCharityCents + independentDonationCents;

    // Pending winner verifications
    const pendingProofs = (db.prepare(`
      SELECT COUNT(*) as c FROM winners WHERE verification_status = 'pending' AND proof_url IS NOT NULL
    `).get() as any).c;

    // Pending payouts
    const pendingPayouts = (db.prepare(`
      SELECT COUNT(*) as c FROM winners WHERE verification_status = 'approved' AND payout_status = 'pending'
    `).get() as any).c;

    const totalPrizePoolRow = db.prepare(`
      SELECT SUM(total_pool_cents) as total FROM prize_pools
    `).get() as any;

    return {
      totalUsers,
      activeSubscribers,
      totalDraws,
      totalPrizeAwardedCents,
      totalPrizePoolCents: totalPrizePoolRow?.total || 0,
      totalCharityRaisedCents,
      subscriptionCharityCents,
      independentDonationCents,
      pendingProofs,
      pendingPayouts,
    };
  },

  getCharityImpactBreakdown() {
    const rows = db.prepare(`
      SELECT c.id, c.name, c.logo_url, c.category,
             COUNT(DISTINCT uc.user_id) as supporters_count,
             COALESCE(SUM(d.amount_cents), 0) as independent_donations_cents
      FROM charities c
      LEFT JOIN user_charities uc ON c.id = uc.charity_id
      LEFT JOIN donations d ON c.id = d.charity_id AND d.status = 'succeeded'
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY supporters_count DESC, independent_donations_cents DESC
    `).all() as any[];

    return rows;
  },

  getRecentActivity() {
    const recentWinners = db.prepare(`
      SELECT w.id, w.prize_amount_cents, w.prize_tier, w.verification_status, w.payout_status, w.created_at,
             p.full_name as user_name, d.draw_number
      FROM winners w
      JOIN profiles p ON w.user_id = p.id
      JOIN draws d ON w.draw_id = d.id
      ORDER BY w.created_at DESC
      LIMIT 10
    `).all() as any[];

    const recentDonations = db.prepare(`
      SELECT d.*, c.name as charity_name
      FROM donations d
      JOIN charities c ON d.charity_id = c.id
      ORDER BY d.created_at DESC
      LIMIT 10
    `).all() as any[];

    return { recentWinners, recentDonations };
  }
};
