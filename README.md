# Digital Heroes

Digital Heroes is a charity-first Stableford score platform with monthly prize draws, subscription plans, winner verification, and independent charity donations.

## Features

- Public homepage, charity directory, charity profiles, draw mechanics, pricing, FAQ, login, and signup
- Subscriber dashboard for scores, subscription state, charity allocation, draws, winnings, profile, and settings
- Stableford scores validated from 1 to 45, one score per date, newest first, with automatic retention of the latest five
- Monthly draw lifecycle: draft, simulation, approved, published, and completed
- Random and algorithmic draw methods
- Integer-cent prize pool calculations: 40% / 35% / 25%, winner splitting, and five-match rollover
- Charity selection with a 10% minimum contribution and separate independent donations
- Winner proof upload, admin approval/rejection, and payout tracking
- Admin dashboards for users, subscriptions, draws, charities, winners, and analytics
- Consistent API responses, authentication middleware, role checks, rate limiting, Helmet, validation, and centralized errors

## Stack and architecture

- Frontend: React, TypeScript, Vite, React Router, Tailwind CSS, Framer Motion, Recharts, Lucide
- Backend: Node.js, Express, TypeScript
- Local development database: sql.js persisted to `server/data`
- Production schema: PostgreSQL/Supabase migration in `supabase/migrations/001_initial_schema.sql`
- Payments: Stripe Checkout and webhook support, with an offline test activation path
- Uploads: local development storage under `server/uploads`; configure Supabase Storage for production

The server follows `routes -> controllers -> services -> repositories`. Business rules stay in services and data access stays in repositories.

## Local development

Requirements: Node.js 20+ and npm.

```bash
cp .env.example .env
cd server
npm install
npm run seed
npm run dev
```

In another terminal:

```bash
cd client
npm install
npm run dev
```

The Vite client runs on its configured local port and proxies API calls to `/api` when deployed behind the same origin. Set `API_BASE_URL` and `CLIENT_URL` for a split deployment.

## Demo accounts

The seed command creates demo users with non-production passwords:

- Subscriber: `subscriber@digitalheroes.test` / `Password123!`
- Inactive subscriber: `inactive@digitalheroes.test` / `Password123!`
- Winner: `winner@digitalheroes.test` / `Password123!`
- Admin: `admin@digitalheroes.test` / `Admin123!`

Never use these credentials outside local development.

## Environment variables

See `.env.example`. Production must provide `JWT_SECRET`, database/Supabase credentials, and Stripe secrets. Stripe secrets are server-only. Configure Stripe webhook delivery to `POST /api/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET`.

## Supabase and deployment

1. Create a new Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor or through the Supabase CLI.
3. Create Supabase Auth users or configure the signup bridge so `profiles.auth_user_id` points at `auth.users.id`.
4. The migration creates the private `winner-proofs` bucket and RLS policies. Use the service role only on the backend and issue signed URLs for proof viewing.
5. Create Stripe Products and recurring Prices, then set `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_YEARLY_PRICE_ID`.
6. Set Supabase and Stripe environment variables on the backend host. Production startup rejects missing JWT, database/Supabase, Stripe key, webhook secret, or Stripe Price ID configuration.
7. Deploy `client` to Vercel and `server` to a Node-compatible host.
8. Set `CLIENT_URL`, `API_BASE_URL`, `VITE_API_BASE_URL`, CORS origins, and Stripe webhook URLs to the deployed addresses.
9. Configure a regulated payout provider separately. Until that integration exists, admins must enter the real bank-transfer reference before marking a winner paid.

The current local adapter is intentionally zero-config and uses sql.js. A production deployment still requires replacing the local repository adapter with a PostgreSQL/Supabase data-access adapter; the migration and RLS policies are ready, but credentials alone do not switch the runtime adapter.

## Testing

```bash
cd server
npm test
npm run build

cd ../client
npm run build
```

The server test suite covers authentication and authorization, score validation/FIFO retention, prize-pool allocation and rollover, charity rules, winner verification, and payment/webhook behavior.

## API overview

- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/PUT /api/profile`
- `GET/POST/PUT/DELETE /api/scores`
- `GET /api/charities`, `GET /api/charities/:id`
- `GET/POST /api/charities/user/selection`
- `GET /api/subscription`, `POST /api/subscription/checkout`, `POST /api/subscription/cancel`
- `GET /api/draws`, `GET /api/draws/:id`, `GET /api/draws/upcoming`
- Admin draw creation, simulation, and publishing under `/api/draws`
- Winner proof, verification, and payout endpoints under `/api/winners`
- Admin analytics under `/api/admin/analytics`
- Stripe webhook at `/api/webhooks/stripe`

All JSON responses use `{ success, message, errorCode, data }`.

## Known limitations

- The local sql.js adapter is not a replacement for production PostgreSQL concurrency and backups.
- The current Stripe simulator is intended for local testing; live checkout requires valid Stripe price IDs and webhook configuration.
- Production Supabase Auth and Storage policy wiring must be completed before launch.
- Vite reports a large production JavaScript chunk; route-level code splitting is a future performance improvement.
