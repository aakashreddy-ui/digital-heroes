// ==========================================
// DIGITAL HEROES SHARED TYPES & CONSTANTS
// ==========================================

export type UserRole = 'visitor' | 'subscriber' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  subscription?: Subscription;
  selected_charity?: UserCharitySelection;
}

export type SubscriptionPlanId = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  price_cents: number; // e.g. 2500 for $25/mo, 25000 for $250/yr
  billing_interval: 'month' | 'year';
  stripe_price_id?: string;
  description: string;
  features: string[];
}

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'incomplete'
  | 'inactive';

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: SubscriptionPlanId;
  status: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// Stableford Score: 1-45, strictly 5 latest per user
export interface StablefordScore {
  id: string;
  user_id: string;
  score: number; // 1 - 45
  score_date: string; // YYYY-MM-DD, unique per user
  course_name?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CharityEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
}

export interface CharityImpactMetric {
  label: string;
  value: string;
  icon?: string;
}

export interface Charity {
  id: string;
  name: string;
  slug: string;
  mission: string;
  description: string;
  category: string;
  logo_url: string;
  hero_image_url: string;
  website: string;
  is_featured: boolean;
  is_active: boolean;
  upcoming_events: CharityEvent[];
  impact_metrics: CharityImpactMetric[];
  created_at: string;
  updated_at?: string;
}

export interface UserCharitySelection {
  id: string;
  user_id: string;
  charity_id: string;
  charity?: Charity;
  contribution_percentage: number; // Minimum 10%
  updated_at: string;
}

export type DrawStatus =
  | 'draft'
  | 'simulation'
  | 'approved'
  | 'published'
  | 'completed';

export type DrawMethod = 'random' | 'algorithmic';

export type PrizeTier = 'five_match' | 'four_match' | 'three_match';

export interface PrizePool {
  id: string;
  draw_id: string;
  total_pool_cents: number;
  subscriber_contribution_cents: number;
  rollover_in_cents: number;
  rollover_out_cents: number;
  tier_5_pool_cents: number; // 40%
  tier_4_pool_cents: number; // 35%
  tier_3_pool_cents: number; // 25%
  tier_5_winner_count: number;
  tier_4_winner_count: number;
  tier_3_winner_count: number;
  tier_5_payout_per_winner_cents: number;
  tier_4_payout_per_winner_cents: number;
  tier_3_payout_per_winner_cents: number;
  created_at: string;
}

export interface Draw {
  id: string;
  draw_number: number;
  draw_date: string;
  month_year: string; // e.g. "2026-09"
  status: DrawStatus;
  method: DrawMethod;
  winning_numbers: number[]; // 5 unique numbers (1-45)
  jackpot_rollover_cents: number;
  total_prize_pool_cents: number;
  prize_pool?: PrizePool;
  published_at?: string;
  published_by?: string;
  created_at: string;
  updated_at?: string;
  total_entries?: number;
  total_winners?: number;
}

export interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  user_name?: string;
  numbers: number[]; // Exactly 5 numbers from user's latest scores
  matched_numbers: number[];
  match_count: number;
  prize_tier: PrizeTier | null;
  is_winner: boolean;
  created_at: string;
}

export type WinnerVerificationStatus = 'pending' | 'approved' | 'rejected';
export type PayoutStatus = 'pending' | 'paid';

export interface Winner {
  id: string;
  draw_id: string;
  draw_number?: number;
  draw_date?: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  entry_id: string;
  prize_tier: PrizeTier;
  prize_amount_cents: number;
  verification_status: WinnerVerificationStatus;
  payout_status: PayoutStatus;
  proof_url?: string;
  proof_file_name?: string;
  proof_uploaded_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  paid_at?: string;
  payout_reference?: string;
  matched_numbers?: number[];
  winning_numbers?: number[];
  created_at: string;
  updated_at?: string;
}

export interface IndependentDonation {
  id: string;
  user_id?: string;
  donor_name?: string;
  donor_email?: string;
  charity_id: string;
  charity_name?: string;
  amount_cents: number;
  frequency: 'one_off' | 'monthly';
  stripe_payment_intent_id?: string;
  status: 'succeeded' | 'pending' | 'failed';
  is_independent: true;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'draw_result' | 'winner' | 'verification' | 'payout' | 'subscription' | 'charity';
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

// Consistent REST API Response Structure
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  errorCode?: string;
  data: T | null;
}

// Constants
export const SCORE_MIN = 1;
export const SCORE_MAX = 45;
export const MAX_STORED_SCORES = 5;
export const MIN_CHARITY_PERCENTAGE = 10;

// Prize Pool Percentages
export const TIER_5_PERCENTAGE = 0.40; // 40%
export const TIER_4_PERCENTAGE = 0.35; // 35%
export const TIER_3_PERCENTAGE = 0.25; // 25%

// Plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
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
