# Digital Heroes Requirements Checklist

Status uses `Implemented`, `Partial`, or `Operational follow-up`.

| Requirement | Status | Evidence |
|---|---|---|
| Public visitor journey and premium homepage | Implemented | `client/src/pages/public`, `HomePage.tsx` |
| Signup, login, logout, persistent session | Implemented | `AuthContext.tsx`, `server/src/controllers/authController.ts` |
| Subscriber/admin route protection and backend role checks | Implemented | `client/src/routes/RouteGuards.tsx`, `server/src/middleware/auth.ts` |
| Monthly and yearly plans | Implemented | `shared/types.ts`, subscription routes/service |
| Stripe Checkout, cancellation, renewal webhook states | Partial | Stripe routes/service exist; production keys and webhook configuration required |
| Stableford validation 1-45 | Implemented | `scoreService.ts`, scores repository, migration, score tests |
| Unique score date, edit/delete, latest five FIFO | Implemented | score service/repository and `server/tests/scores.test.ts` |
| Random and algorithmic monthly draw | Implemented | draw service/routes and admin draw page |
| Simulation, publish lifecycle, persistent results | Implemented | draw repositories/controllers, draw pages |
| Prize pool 40% / 35% / 25%, split, rollover | Implemented | `prizePoolService.ts`, `server/tests/prizePool.test.ts` |
| Charity selection and minimum 10% | Implemented | charity service/routes, migration, charity tests |
| Independent donations separate from subscription contributions | Implemented | donation service/routes, donations table |
| Charity directory, search, filtering, profiles, featured content | Implemented | public charity pages and charity routes |
| Winner proof upload and validation | Implemented locally | upload middleware, winner routes/service, winner tests |
| Admin winner verification, rejection, payout | Implemented | admin winner page and winner service/routes |
| Subscriber dashboard | Implemented | `client/src/pages/dashboard` |
| Admin dashboard, user/subscription/charity/draw/winner management | Implemented | `client/src/pages/admin` |
| Analytics and reports | Implemented | analytics controller/repository/page |
| REST API response envelope and centralized errors | Implemented | `shared/types.ts`, error middleware |
| Seed/demo users, charities, draws, winners | Implemented | `server/src/seeds/seedData.ts` |
| Automated critical business-logic tests | Implemented | `server/tests` |
| PostgreSQL/Supabase relational schema | Implemented as migration | `supabase/migrations/001_initial_schema.sql` |
| Production Supabase Auth, Storage policies, and managed DB adapter | Operational follow-up | Required before real deployment; local adapter currently uses sql.js |
| Vercel/backend deployment and Stripe webhook provisioning | Operational follow-up | Deployment steps documented in `README.md` |
| Responsive/mobile polish and bundle optimization | Partial | Responsive layouts exist; client build reports a large chunk requiring code splitting |
