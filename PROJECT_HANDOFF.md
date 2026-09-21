# Digital Heroes Project Handoff

Updated: 2026-09-21

## 1. Project Summary

Digital Heroes is a charity-first Stableford golf platform. Members track their latest five scores, participate in monthly prize draws, choose a charity contribution percentage, make independent donations, upload winner proof, and manage subscriptions.

The repository contains a React/Vite client, an Express/TypeScript server, shared TypeScript types, a local sql.js database adapter, a Supabase/PostgreSQL migration, Stripe Checkout/webhook support, and automated server tests.

## 2. Technology Stack

- Client: React, TypeScript, Vite, React Router, Tailwind CSS, Framer Motion, Recharts, and Lucide.
- Server: Node.js, Express, TypeScript, Helmet, CORS, rate limiting, Zod, bcrypt, JWT, Stripe, and sql.js.
- Local database: sql.js persisted under `server/data`.
- Production schema: `supabase/migrations/001_initial_schema.sql`.
- Hosting: Render for the backend and Netlify for the frontend.
- Payments: Stripe sandbox/test mode with Checkout and signed webhooks.

The server is organized as routes, controllers, services, repositories, and middleware. Business rules are kept in services and data access is kept in repositories.

## 3. Implemented Product Areas

### Public experience

- Premium homepage.
- Charity directory with search/filtering and featured charities.
- Charity detail pages.
- Draw mechanics page.
- Pricing page for monthly and yearly plans.
- How-it-works page.
- Login and signup pages.
- Responsive navigation and footer.

### Authentication

- Signup with full name, email, password, and optional phone.
- Login and logout.
- JWT-based sessions.
- Protected subscriber and admin routes.
- Backend role checks.
- Seeded demo accounts for local development only.

### Subscriber dashboard

- Overview dashboard.
- Stableford score management.
- Latest-five-score FIFO behavior.
- Charity selection and contribution percentage.
- Subscription status and cancellation.
- Draw participation.
- Winner history and proof upload.
- Profile and settings pages.

### Admin dashboard

- User management.
- Subscription management.
- Charity creation, editing, featuring, and deactivation.
- Draw creation, simulation, and publishing.
- Winner verification and payout tracking.
- Analytics and reports.

### Scores and draws

- Score range validation: 1 through 45.
- One score per user per date.
- Latest five scores retained.
- Random and algorithmic draw methods.
- Draft, simulation, published, and completed draw lifecycle.
- Five winning numbers per draw.
- Prize tiers of 40%, 35%, and 25%.
- Five-match jackpot rollover.
- Winner splitting across each tier.

### Charities and donations

- Minimum charity contribution: 10%.
- Maximum charity contribution: 100%.
- Separate independent donation flow.
- Charity impact metrics and upcoming events.
- Donation records and Stripe payment metadata.

### Payments

- Stripe monthly and yearly subscription Checkout.
- Stripe independent donation Checkout.
- Checkout completion webhook handling.
- Subscription update webhook handling.
- Subscription deletion webhook handling.
- Test activation route disabled in production.
- Production configuration validation for Stripe secrets, webhook secret, and Price IDs.

### Security and API behavior

- Helmet security headers.
- CORS configuration.
- Rate limiting.
- Centralized error handling.
- Zod request validation.
- Consistent `{ success, message, errorCode, data }` responses.
- Password hashing with bcrypt.
- JWT authentication.
- Admin authorization.

## 4. Important API Routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/scores`
- `GET /api/charities`
- `GET /api/charities/:id`
- `GET/POST /api/charities/user/selection`
- `GET /api/subscription/plans`
- `GET /api/subscription`
- `POST /api/subscription/checkout`
- `POST /api/subscription/cancel`
- `GET /api/draws`
- `GET /api/draws/upcoming`
- `GET /api/draws/latest`
- `POST /api/draws/:id/simulate`
- `POST /api/draws/:id/publish`
- `GET /api/winners/user`
- `POST /api/winners/:id/proof`
- `POST /api/webhooks/stripe`
- `GET /api/health`

## 5. Deployment Record

### Backend

- Host: Render.
- Branch: `main-setup`.
- Service URL: `https://digital-heroes-1-carh.onrender.com`.
- API URL: `https://digital-heroes-1-carh.onrender.com/api`.
- Health URL: `https://digital-heroes-1-carh.onrender.com/api/health`.
- Root directory: `server`.
- Build command: `npm install && npm run build`.
- Start command: `npm start`.
- Start script: `node dist/server/src/index.js`.
- Render detects the service on port `5001`.

The health endpoint was verified with a successful `200` response:

```json
{"status":"ok","time":"2026-09-21T17:32:12.693Z"}
```

### Frontend

- Host: Netlify.
- Site URL: `https://digital-heroes1.netlify.app/`.
- Branch: `main-setup`.
- Base directory: `client`.
- Build command: `npm run build`.
- Publish directory: `dist`.
- Frontend API variable for the current Netlify proxy setup:

```text
VITE_API_BASE_URL=/api
```

The frontend build was verified successfully. Vite reports only a non-blocking large JavaScript chunk warning.

### Netlify configuration

`netlify.toml` configures the client build and proxies API calls:

```toml
[build]
  base = "client"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://digital-heroes-1-carh.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

`client/public/_redirects` contains the equivalent static rules:

```text
/api/* https://digital-heroes-1-carh.onrender.com/api/:splat 200
/* /index.html 200
```

The API proxy was added to eliminate browser-only cross-origin failures from the Netlify frontend.

### CORS

The backend explicitly allows:

- The configured `CLIENT_URL`.
- `https://digital-heroes1.netlify.app`.
- `http://localhost:3000`.
- `http://localhost:5173`.

Render must still have this environment variable set to the exact Netlify origin:

```text
CLIENT_URL=https://digital-heroes1.netlify.app
```

Do not add a trailing slash.

## 6. Stripe Sandbox Setup

Stripe was configured in a new business sandbox/test environment.

Webhook destination:

```text
https://digital-heroes-1-carh.onrender.com/api/webhooks/stripe
```

Events handled by the backend:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

The Stripe CLI was installed after the macOS Command Line Tools issue was addressed, and this test succeeded:

```bash
stripe trigger checkout.session.completed
```

Observed result:

```text
Trigger succeeded! Check dashboard for event details.
```

The Render environment variable must contain the Stripe signing secret copied from the webhook destination:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

It must not contain the webhook URL.

## 7. Verified Tests and Checks

The following checks passed during the implementation:

```bash
cd server
npm test
npm run build

cd ../client
npm run build
```

The server test suite covers:

- Authentication and authorization.
- Score range and duplicate-date rules.
- Latest-five FIFO retention.
- Prize-pool allocation and rollover.
- Charity contribution rules.
- Winner verification.
- Payment and webhook behavior.

Additional live checks passed:

- Render health endpoint returned `200`.
- Render signup endpoint returned `201` for a fresh test account.
- CORS preflight returned `Access-Control-Allow-Origin: https://digital-heroes1.netlify.app` after the backend redeploy.
- A real signup request with the Netlify origin returned `Registration successful`.
- Netlify returned the frontend HTML with `200`.
- Stripe CLI test event completed successfully.

## 8. Git Deployment Commits

Recent deployment commits on `main-setup`:

- `bc526d3` Fix TypeScript module resolution for Render.
- `fdd1739` Configure Netlify frontend deployment.
- `773387e` Allow Netlify frontend origin.
- `88b8283` Proxy frontend API through Netlify.

## 9. Troubleshooting History

### `Cannot GET /api/webhooks/stripe`

The route is POST-only because Stripe sends webhook events with POST. A browser GET correctly returns 404. An unsigned manual POST returns `400 INVALID_SIGNATURE`, which proves the route is mounted and signature verification is active.

### Render root URL returned 404

The backend intentionally exposes API routes under `/api`; there is no homepage route at `/`. The correct health check is `/api/health`.

### Signup showed `Failed to fetch`

The backend itself was healthy and direct signup requests succeeded. The browser failure came from the deployed frontend/API cross-origin path. The fix was:

1. Explicitly allow the Netlify origin in backend CORS.
2. Add a Netlify `/api/*` proxy to Render.
3. Set Netlify `VITE_API_BASE_URL` to `/api`.
4. Redeploy both services.

### Netlify `dist` command returned exit code 127

`dist` is a directory, not a shell command. The build itself had already succeeded; the command should be `npm run build`, with `dist` configured as the publish directory.

### Duplicate `STRIPE_WEBHOOK_SECRET`

Render already contained the variable. The correct action is to edit the existing value and replace it with the `whsec_...` signing secret.

## 10. Demo Accounts

These accounts are for local/demo testing only:

- Admin: `admin@digitalheroes.test` / `Admin123!`
- Subscriber: `subscriber@digitalheroes.test` / `Password123!`
- Inactive: `inactive@digitalheroes.test` / `Password123!`
- Winner: `winner@digitalheroes.test` / `Password123!`

Never use these credentials in production.

## 11. Current Production Gaps

The sandbox deployment is functional, but it is not ready for real customers until these items are completed:

1. Replace the production sql.js/local database adapter with a real PostgreSQL/Supabase data-access adapter.
2. Confirm Supabase Auth integration and profile linkage.
3. Move winner proof files from local disk to Supabase Storage.
4. Configure private bucket access and signed proof URLs.
5. Rotate any credentials or tokens that were exposed in tracked files or chat history.
6. Remove real-looking secrets from `.env.example`; templates should contain placeholders only.
7. Confirm Render uses the real `STRIPE_WEBHOOK_SECRET` value beginning with `whsec_`.
8. Confirm the Stripe webhook destination reports successful `2xx` deliveries.
9. Configure a regulated payout provider before processing real winnings.
10. Run a final end-to-end sandbox test for signup, login, subscription checkout, cancellation, donation checkout, scores, draw simulation, proof upload, verification, and payout recording.
11. Add route-level code splitting to reduce the large frontend bundle.

## 12. Operational Next Steps

For the current sandbox deployment:

1. Ensure Netlify contains `VITE_API_BASE_URL=/api`.
2. Redeploy Netlify from the latest `main-setup` commit.
3. Ensure Render contains `CLIENT_URL=https://digital-heroes1.netlify.app`.
4. Redeploy Render from the latest `main-setup` commit.
5. Open `https://digital-heroes1.netlify.app/signup` and create a fresh test account.
6. Test login and the Stripe sandbox subscription flow.
7. Check Stripe webhook delivery for a `2xx` response.

## 13. Full Infrastructure Setup Guide

### A. Create Supabase

1. Open `https://supabase.com/dashboard` and create a new project.
2. Choose an organization, project name, database password, and region.
3. Wait until the project finishes provisioning.
4. Open **SQL Editor**.
5. Open `supabase/migrations/001_initial_schema.sql` from this repository.
6. Paste the complete migration into the SQL Editor and run it.
7. Confirm the tables, policies, and `winner-proofs` storage bucket were created.
8. Open **Project Settings → API** and copy the project URL, anon key, and service-role key.
9. Keep the service-role key private and use it only on the backend.

Required backend values:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Important: the current runtime still uses the local sql.js adapter. Running the migration and adding Supabase keys alone does not switch the repository implementation to PostgreSQL/Supabase.

### B. Create Stripe products and prices

1. Open `https://dashboard.stripe.com`.
2. Switch to **Test mode** or the intended sandbox.
3. Open **Product catalog → Add product**.
4. Create the monthly product:
  - Name: `Digital Hero Monthly`
  - Amount: `$25.00`
  - Recurring interval: monthly
5. Create the yearly product:
  - Name: `Digital Hero Yearly`
  - Amount: `$250.00`
  - Recurring interval: yearly
6. Copy both recurring Price IDs.

Set them on Render:

```text
STRIPE_MONTHLY_PRICE_ID=price_monthly_test_id
STRIPE_YEARLY_PRICE_ID=price_yearly_test_id
```

From **Developers → API keys**, copy the test secret and publishable keys:

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### C. Create the Stripe webhook

1. Open **Developers → Webhooks**.
2. Select **Add destination** or **Add endpoint**.
3. Use this endpoint:

```text
https://digital-heroes-1-carh.onrender.com/api/webhooks/stripe
```

4. Select the account event source and snapshot payloads.
5. Listen to:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
6. Create the destination.
7. Reveal and copy the signing secret beginning with `whsec_`.

Set the existing Render variable, rather than adding a duplicate:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

The webhook secret is not the endpoint URL.

### D. Create and deploy the Render backend

1. Push the repository to GitHub.
2. Open `https://render.com` and choose **New → Web Service**.
3. Connect the GitHub repository and select branch `main-setup`.
4. Configure:

```text
Root directory: server
Build command: npm install && npm run build
Start command: npm start
```

5. Add these environment variables:

```text
NODE_ENV=production
JWT_SECRET=generate-a-long-random-secret
CLIENT_URL=https://digital-heroes1.netlify.app
API_BASE_URL=https://digital-heroes-1-carh.onrender.com/api
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_monthly_test_id
STRIPE_YEARLY_PRICE_ID=price_yearly_test_id
PAYOUT_PROVIDER=manual
```

6. Deploy the service.
7. Confirm the logs show `Digital Heroes server running`.
8. Verify:

```text
https://digital-heroes-1-carh.onrender.com/api/health
```

Expected response:

```json
{"status":"ok","time":"..."}
```

### E. Create and deploy the Netlify frontend

1. Open `https://app.netlify.com`.
2. Choose **Add new project → Import an existing project**.
3. Select GitHub and choose the repository.
4. Select branch `main-setup`.
5. Configure:

```text
Base directory: client
Build command: npm run build
Publish directory: dist
```

6. Add this environment variable:

```text
VITE_API_BASE_URL=/api
```

7. Deploy the site.
8. Confirm the Netlify URL loads.
9. Confirm the site uses the API proxy in `netlify.toml` and `client/public/_redirects`.
10. Test signup, login, charity loading, and pricing.

### F. Verify the complete sandbox flow

1. Create a fresh account on the Netlify site.
2. Log in.
3. Choose a charity and contribution percentage.
4. Add Stableford scores.
5. Start a monthly or yearly Stripe Checkout session.
6. Use Stripe test payment details only.
7. Confirm Stripe sends `checkout.session.completed`.
8. Confirm the webhook delivery is `2xx`.
9. Confirm the subscription status updates in the dashboard.
10. Test cancellation and confirm the webhook updates the local record.
11. Test an independent donation in Stripe test mode.

### G. Stripe CLI test

After installing and authenticating the Stripe CLI in the correct sandbox:

```bash
stripe login
stripe trigger checkout.session.completed
```

Expected output:

```text
Trigger succeeded! Check dashboard for event details.
```

### H. Secret handling

- Never commit `sk_test_...`, `sk_live_...`, `whsec_...`, Supabase service-role keys, or real JWT secrets.
- Use placeholders in `.env.example`.
- Rotate any credential that was exposed in Git history, chat, screenshots, or public repositories.
- Keep Stripe and Supabase service credentials on Render only.

## 14. Detailed First-Time Setup Runbook

This section is written for a fresh machine and a new deployment. Complete the steps in order. Do not switch to live Stripe mode until the sandbox flow is working.

### 14.1 Before you begin

Install or create these accounts:

- GitHub account with access to the repository.
- Supabase account.
- Stripe account with a test-mode sandbox.
- Render account connected to GitHub.
- Netlify account connected to GitHub.
- Node.js 20 or newer.
- npm.
- Git.

Confirm local tools:

```bash
node --version
npm --version
git --version
```

On macOS, if Homebrew or the Stripe CLI reports outdated Command Line Tools, open **System Settings → General → Software Update** and install the current Command Line Tools package before retrying.

### 14.2 Clone and inspect the repository

```bash
git clone https://github.com/aakashreddy-ui/digital-heroes.git
cd digital-heroes
git checkout main-setup
```

The important directories are:

```text
client/                 React/Vite frontend
server/                 Express API and business logic
shared/                 Shared TypeScript contracts/constants
supabase/migrations/    PostgreSQL schema and RLS policies
netlify.toml            Netlify build, proxy, and SPA rules
```

Install dependencies separately because the repository has separate client and server package files:

```bash
npm --prefix server install
npm --prefix client install
```

### 14.3 Local environment setup

Create a local environment file from the template:

```bash
cp .env.example .env
```

For local simulator mode, use placeholders or local values. Do not paste production secrets into the repository. A minimal local configuration is:

```text
NODE_ENV=development
PORT=5001
JWT_SECRET=local-only-secret-change-me
CLIENT_URL=http://localhost:3000
API_BASE_URL=http://localhost:5001/api
VITE_API_BASE_URL=/api
STRIPE_SIMULATOR_ENABLED=true
PAYOUT_PROVIDER=manual
```

Start the API:

```bash
npm --prefix server run seed
npm --prefix server run dev
```

In another terminal, start the client:

```bash
npm --prefix client run dev
```

Open `http://localhost:3000`. The Vite development server proxies `/api` and `/uploads` to `http://localhost:5001`.

Check the local API:

```bash
curl http://localhost:5001/api/health
```

Expected shape:

```json
{"status":"ok","time":"..."}
```

### 14.4 Supabase dashboard details

When creating the Supabase project:

1. Choose a project name that matches the application.
2. Generate a strong database password and store it in a password manager.
3. Choose a region close to the Render service region.
4. Wait for the project status to become ready.
5. Open **SQL Editor → New query**.
6. Copy the complete contents of `supabase/migrations/001_initial_schema.sql`.
7. Paste the migration without removing statements.
8. Click **Run**.
9. Open **Table Editor** and confirm core tables such as `profiles`, `subscriptions`, `scores`, `charities`, `draws`, `winners`, and `donations` exist.
10. Open **Storage** and confirm the `winner-proofs` bucket and policies exist.
11. Open **Project Settings → API** and copy the URL, anon key, and service-role key.

The anon key may be used in browser-facing Supabase clients if the application later adds one. The service-role key must never be placed in Netlify, browser JavaScript, `.env.example`, screenshots, or client code.

Important architecture boundary: this repository currently initializes sql.js in `server/src/db/index.ts`. The migration prepares Supabase, but the server repositories still use the local adapter. A real production migration requires implementing the repository adapter, selecting it from configuration, migrating existing data, and testing transactions/concurrency before relying on Supabase credentials.

### 14.5 Stripe dashboard details

Use one Stripe mode consistently. A `sk_test_...` key must be paired with test-mode Price IDs and a test-mode webhook secret. A live key must never be mixed with sandbox values.

Create the products:

1. Open **Product catalog**.
2. Click **Add product**.
3. Enter the monthly product name and description.
4. Add a recurring price of 25 USD every month.
5. Save and copy the Price ID.
6. Add the yearly product.
7. Add a recurring price of 250 USD every year.
8. Save and copy the Price ID.

Use the test card below only in Stripe test mode:

```text
Card number: 4242 4242 4242 4242
Expiry: any future month/year
CVC: any three digits
ZIP: any valid test ZIP
```

Create the webhook after the Render URL exists. If Stripe offers **destination** terminology instead of **endpoint**, use the destination form. The endpoint URL is the Render URL plus `/api/webhooks/stripe`; do not use the Netlify URL for Stripe webhooks.

After creating the destination:

1. Open the destination details.
2. Find **Signing secret**.
3. Click **Reveal**.
4. Copy the complete `whsec_...` value.
5. Edit the existing Render `STRIPE_WEBHOOK_SECRET` variable.
6. Save and redeploy Render.

### 14.6 Render dashboard details

Create a **Web Service**, not a static site:

1. Click **New → Web Service**.
2. Connect the GitHub repository.
3. Select branch `main-setup`.
4. Set the root directory to `server`.
5. Set build command to `npm install && npm run build`.
6. Set start command to `npm start`.
7. Choose a region and instance type.
8. Add environment variables before the first production deployment.

Render provides `PORT`; the server reads it and falls back to `5001` locally. Do not hard-code a different public port.

After deployment, inspect **Logs**. A healthy service should show seed/startup output and a line containing `Digital Heroes server running`. A missing production variable causes startup validation to fail. Fix the variable in **Environment**, save, and redeploy.

Render environment checklist:

```text
NODE_ENV=production
JWT_SECRET=<long random value>
CLIENT_URL=https://digital-heroes1.netlify.app
API_BASE_URL=https://digital-heroes-1-carh.onrender.com/api
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
STRIPE_SECRET_KEY=sk_test_<value>
STRIPE_PUBLISHABLE_KEY=pk_test_<value>
STRIPE_WEBHOOK_SECRET=whsec_<value>
STRIPE_MONTHLY_PRICE_ID=price_<monthly value>
STRIPE_YEARLY_PRICE_ID=price_<yearly value>
PAYOUT_PROVIDER=manual
```

Do not create duplicate keys. If Render says `Duplicate key is not allowed`, edit the existing key instead. The webhook secret must start with `whsec_`; the endpoint URL is not a secret.

### 14.7 Netlify dashboard details

Create a frontend site:

1. Click **Add new project → Import an existing project**.
2. Choose GitHub.
3. Select the repository and branch `main-setup`.
4. Set base directory to `client`.
5. Set build command to `npm run build`.
6. Set publish directory to `dist`.
7. Set `VITE_API_BASE_URL` to `/api`.
8. Deploy.

The value `/api` is intentional. Netlify proxies it to Render through `netlify.toml` and `client/public/_redirects`. This avoids browser CORS failures and keeps the Render API URL out of frontend request configuration.

When changing a Vite environment variable, trigger a new Netlify deploy. Vite embeds environment values at build time; editing a variable does not change an already-published bundle.

After deployment:

1. Open the Netlify URL.
2. Open `/signup` directly.
3. Refresh `/pricing` and `/dashboard` routes to verify the SPA fallback.
4. Open browser developer tools and check that API requests use the Netlify `/api` path.

### 14.8 Exact verification commands

Backend health:

```bash
curl -i https://digital-heroes-1-carh.onrender.com/api/health
```

Signup through Render:

```bash
curl -i -X POST https://digital-heroes-1-carh.onrender.com/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"fresh@example.com","password":"TestPass123!","full_name":"Fresh User"}'
```

Signup through Netlify proxy:

```bash
curl -i -X POST https://digital-heroes1.netlify.app/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"fresh-netlify@example.com","password":"TestPass123!","full_name":"Fresh Netlify User"}'
```

Use a new email each time. A repeated email should return `EMAIL_EXISTS`, which is an application response rather than a network failure.

Webhook route check:

```bash
curl -i -X POST https://digital-heroes-1-carh.onrender.com/api/webhooks/stripe \
  -H 'Content-Type: application/json' \
  -d '{}'
```

An unsigned manual request may return `400 INVALID_SIGNATURE`; that proves the route is reachable. A real Stripe-signed event should return `2xx`.

Local automated checks:

```bash
npm --prefix server test
npm --prefix server run build
npm --prefix client run build
```

### 14.9 Browser error decision tree

If the browser says `Failed to fetch`:

1. Confirm the page is the current Netlify deployment.
2. Confirm Netlify has `VITE_API_BASE_URL=/api`.
3. Trigger a new Netlify deploy after changing that variable.
4. Check browser Network for a request to `/api/auth/signup`.
5. If the request goes to `/apiapi`, fix the environment value.
6. If it goes to `localhost`, redeploy the frontend with the correct value.
7. If it returns `404`, confirm the path is `/api/auth/signup`.
8. If it returns `400`, read the JSON message; likely causes are invalid fields or duplicate email.
9. If it returns `500`, inspect Render logs.
10. If the preflight has no `Access-Control-Allow-Origin`, set `CLIENT_URL` in Render and redeploy.

If the browser says `Cannot GET /api/webhooks/stripe`, use POST instead. Stripe webhooks are not browser pages.

If Render shows `Cannot find module` or an old build, confirm the root directory is `server`, branch is `main-setup`, and the build completed after the latest commit.

### 14.10 Final launch gate

Do not accept real customers until every item below is true:

- Supabase schema and production adapter are both verified.
- Data persistence survives a Render redeploy.
- Winner proofs use private Supabase Storage, not ephemeral local disk.
- Live/test Stripe mode is deliberately selected and documented.
- Webhook signing secret matches the selected Stripe mode.
- Stripe webhook deliveries are consistently `2xx`.
- Netlify can create and authenticate accounts.
- CORS and/or Netlify proxy behavior is verified.
- Password reset, account deletion, privacy, terms, and responsible gaming requirements are addressed.
- Payout compliance and a regulated payout provider are configured.
- Production secrets have been rotated and removed from tracked templates/history.
- Backups, logging, monitoring, and an incident recovery process exist.

## 15. Source Documents

- `README.md`: project overview, local development, API routes, and deployment notes.
- `REQUIREMENTS_CHECKLIST.md`: feature-to-requirement traceability.
- `.env.example`: environment variable template.
- `netlify.toml`: Netlify build, SPA fallback, and API proxy configuration.
- `supabase/migrations/001_initial_schema.sql`: production database schema and policies.
- `server/src/app.ts`: Express middleware, CORS, webhook, and API mounting.
- `server/src/services/subscriptionService.ts`: Stripe Checkout and webhook handling.
- `server/src/services/donationService.ts`: independent donation Checkout and completion handling.
- `client/src/api/client.ts`: frontend API client.
