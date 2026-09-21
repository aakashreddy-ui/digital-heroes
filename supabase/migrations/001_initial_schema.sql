-- DIGITAL HEROES SUPABASE / POSTGRESQL INITIAL SCHEMA
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (extends Supabase auth.users or standalone)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('visitor', 'subscriber', 'admin')),
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY, -- 'monthly', 'yearly'
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents > 0),
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year')),
    stripe_price_id TEXT,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'past_due', 'cancelled', 'incomplete', 'inactive')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- 4. Charities Table
CREATE TABLE IF NOT EXISTS charities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    mission TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Community',
    logo_url TEXT NOT NULL,
    hero_image_url TEXT NOT NULL,
    website TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    upcoming_events JSONB DEFAULT '[]'::jsonb,
    impact_metrics JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. User Charity Selections (min 10% contribution)
CREATE TABLE IF NOT EXISTS user_charities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
    contribution_percentage INTEGER NOT NULL DEFAULT 10 CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_charity UNIQUE (user_id)
);

-- 6. Scores Table (Stableford 1-45, unique date per user, max 5 per user enforced)
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
    score_date DATE NOT NULL,
    course_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_score_date UNIQUE (user_id, score_date)
);

-- 7. Monthly Draws
CREATE TABLE IF NOT EXISTS draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_number SERIAL UNIQUE,
    draw_date TIMESTAMPTZ NOT NULL,
    month_year TEXT NOT NULL, -- e.g. '2026-09'
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'simulation', 'approved', 'published', 'completed')),
    method TEXT NOT NULL DEFAULT 'random' CHECK (method IN ('random', 'algorithmic')),
    winning_numbers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of 5 integers (1-45)
    jackpot_rollover_cents INTEGER NOT NULL DEFAULT 0 CHECK (jackpot_rollover_cents >= 0),
    total_prize_pool_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_prize_pool_cents >= 0),
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Draw Entries
CREATE TABLE IF NOT EXISTS draw_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    numbers JSONB NOT NULL, -- 5 integers from user's latest scores
    matched_numbers JSONB NOT NULL DEFAULT '[]'::jsonb,
    match_count INTEGER NOT NULL DEFAULT 0 CHECK (match_count >= 0 AND match_count <= 5),
    prize_tier TEXT CHECK (prize_tier IN ('five_match', 'four_match', 'three_match', NULL)),
    is_winner BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_draw_user_entry UNIQUE (draw_id, user_id)
);

-- 9. Prize Pools (40% / 35% / 25% distribution)
CREATE TABLE IF NOT EXISTS prize_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE UNIQUE,
    total_pool_cents INTEGER NOT NULL DEFAULT 0,
    subscriber_contribution_cents INTEGER NOT NULL DEFAULT 0,
    rollover_in_cents INTEGER NOT NULL DEFAULT 0,
    rollover_out_cents INTEGER NOT NULL DEFAULT 0,
    tier_5_pool_cents INTEGER NOT NULL DEFAULT 0, -- 40% + rollover_in
    tier_4_pool_cents INTEGER NOT NULL DEFAULT 0, -- 35%
    tier_3_pool_cents INTEGER NOT NULL DEFAULT 0, -- 25%
    tier_5_winner_count INTEGER NOT NULL DEFAULT 0,
    tier_4_winner_count INTEGER NOT NULL DEFAULT 0,
    tier_3_winner_count INTEGER NOT NULL DEFAULT 0,
    tier_5_payout_per_winner_cents INTEGER NOT NULL DEFAULT 0,
    tier_4_payout_per_winner_cents INTEGER NOT NULL DEFAULT 0,
    tier_3_payout_per_winner_cents INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Winners Table
CREATE TABLE IF NOT EXISTS winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES draw_entries(id) ON DELETE CASCADE,
    prize_tier TEXT NOT NULL CHECK (prize_tier IN ('five_match', 'four_match', 'three_match')),
    prize_amount_cents INTEGER NOT NULL CHECK (prize_amount_cents >= 0),
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid')),
    proof_url TEXT,
    proof_file_name TEXT,
    proof_uploaded_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    paid_at TIMESTAMPTZ,
    payout_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_winner_entry UNIQUE (entry_id)
);

-- 11. Winner Proofs
CREATE TABLE IF NOT EXISTS winner_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    winner_id UUID NOT NULL REFERENCES winners(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    original_filename TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Payouts Table
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    winner_id UUID NOT NULL REFERENCES winners(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payout_method TEXT NOT NULL DEFAULT 'bank_transfer',
    transaction_reference TEXT,
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Independent Donations (not tied to gameplay)
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    frequency TEXT NOT NULL DEFAULT 'one_off' CHECK (frequency IN ('one_off', 'monthly')),
    donor_name TEXT,
    donor_email TEXT,
    stripe_payment_intent_id TEXT,
    status TEXT NOT NULL DEFAULT 'succeeded' CHECK (status IN ('succeeded', 'pending', 'failed')),
    is_independent BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('draw_result', 'winner', 'verification', 'payout', 'subscription', 'charity')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Admin Actions Audit Log
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS draw_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_scores_user_date ON scores(user_id, score_date DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw ON draw_entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user ON draw_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_user ON winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_verification ON winners(verification_status);
CREATE INDEX IF NOT EXISTS idx_charities_slug ON charities(slug);
CREATE INDEX IF NOT EXISTS idx_charities_featured ON charities(is_featured);

-- Initial Plans Seed
INSERT INTO subscription_plans (id, name, price_cents, billing_interval, description, features)
VALUES 
    ('monthly', 'Digital Hero Monthly', 2500, 'month', 'Full access to Stableford score tracking, monthly draws, and charitable impact.', '["Enter & track latest 5 Stableford scores", "Automatic entry into monthly cash draws", "Min 10% directly funds your chosen charity", "Eligible for 5-number, 4-number & 3-number prizes", "Full subscriber analytics and charity reports"]'::jsonb),
    ('yearly', 'Digital Hero Yearly', 25000, 'year', 'Year-round impact and draw participation with 2 months free.', '["All Monthly Plan features included", "Save $50 with annual billing (2 months free)", "Guaranteed 12 monthly draw entries", "Priority winner verification and payout", "Dedicated Hero Patron badge in charity leaderboards"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Production security boundary.
-- The backend uses the Supabase service role for trusted mutations; browser clients
-- must only receive rows allowed by these policies.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE winner_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_self_read ON profiles FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY plans_public_read ON subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY charities_public_read ON charities FOR SELECT USING (is_active = true);
CREATE POLICY user_charities_self_read ON user_charities FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_charities_self_write ON user_charities FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY scores_self_access ON scores FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY draws_public_read ON draws FOR SELECT USING (status IN ('published', 'completed'));
CREATE POLICY entries_self_read ON draw_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY winners_self_read ON winners FOR SELECT USING (user_id = auth.uid());
CREATE POLICY proofs_winner_read ON winner_proofs FOR SELECT USING (
    EXISTS (SELECT 1 FROM winners w WHERE w.id = winner_id AND w.user_id = auth.uid())
);
CREATE POLICY payouts_self_read ON payouts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY donations_self_read ON donations FOR SELECT USING (user_id = auth.uid());

-- Winner proof files are private. The backend should issue short-lived signed URLs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('winner-proofs', 'winner-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY winner_proofs_object_read ON storage.objects FOR SELECT USING (
    bucket_id = 'winner-proofs' AND (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM winners w
            WHERE w.user_id = auth.uid()
            AND split_part(name, '/', 1) = w.id::text
        )
    )
);

CREATE POLICY winner_proofs_object_insert ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'winner-proofs' AND auth.role() = 'service_role'
);
