import bcrypt from 'bcryptjs';
import { db, initDatabase } from '../db';
import { v4 as uuidv4 } from 'uuid';

export async function seed() {
  console.log('🌱 Starting Digital Heroes seed...');
  await initDatabase();

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);

  const now = new Date();
  const isoNow = now.toISOString();

  // 1. Users
  const adminId = uuidv4();
  const subscriberId = uuidv4();
  const inactiveSubId = uuidv4();
  const winnerUserId = uuidv4();

  // Check if already seeded
  const existingAdmin = db.prepare('SELECT id FROM profiles WHERE email = ?').get('admin@digitalheroes.test');
  if (existingAdmin) {
    console.log('Database already contains seed data. Resetting demo data...');
    db.prepare('DELETE FROM winner_proofs').run();
    db.prepare('DELETE FROM payouts').run();
    db.prepare('DELETE FROM winners').run();
    db.prepare('DELETE FROM draw_entries').run();
    db.prepare('DELETE FROM prize_pools').run();
    db.prepare('DELETE FROM draws').run();
    db.prepare('DELETE FROM scores').run();
    db.prepare('DELETE FROM user_charities').run();
    db.prepare('DELETE FROM donations').run();
    db.prepare('DELETE FROM subscriptions').run();
    db.prepare('DELETE FROM profiles').run();
    db.prepare('DELETE FROM charities').run();
  }

  // Insert Profiles
  const insertProfile = db.prepare(`
    INSERT INTO profiles (id, email, password_hash, full_name, role, avatar_url, phone, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProfile.run(
    adminId,
    'admin@digitalheroes.test',
    adminPasswordHash,
    'Alexander Vance (Admin)',
    'admin',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    '+1 555-0199',
    isoNow,
    isoNow
  );

  insertProfile.run(
    subscriberId,
    'subscriber@digitalheroes.test',
    passwordHash,
    'Marcus Reed (Active Hero)',
    'subscriber',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    '+1 555-0142',
    isoNow,
    isoNow
  );

  insertProfile.run(
    inactiveSubId,
    'inactive@digitalheroes.test',
    passwordHash,
    'Claire Thornton (Inactive)',
    'subscriber',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    '+1 555-0177',
    isoNow,
    isoNow
  );

  insertProfile.run(
    winnerUserId,
    'winner@digitalheroes.test',
    passwordHash,
    'David Miller (Recent Winner)',
    'subscriber',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    '+1 555-0188',
    isoNow,
    isoNow
  );

  // 2. Subscriptions
  const insertSub = db.prepare(`
    INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextYear = new Date(now);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  insertSub.run(uuidv4(), subscriberId, 'monthly', 'active', isoNow, nextMonth.toISOString(), isoNow, isoNow);
  insertSub.run(uuidv4(), winnerUserId, 'yearly', 'active', isoNow, nextYear.toISOString(), isoNow, isoNow);
  insertSub.run(uuidv4(), inactiveSubId, 'monthly', 'cancelled', lastMonth.toISOString(), isoNow, isoNow, isoNow);

  // Also give 15 other mock active subscribers for realistic prize pool calculations
  const mockSubIds: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const mId = uuidv4();
    mockSubIds.push(mId);
    insertProfile.run(
      mId,
      `hero${i}@digitalheroes.test`,
      passwordHash,
      `Hero Golfer #${i}`,
      'subscriber',
      `https://api.dicebear.com/7.x/avataaars/svg?seed=Hero${i}`,
      `+1 555-01${i.toString().padStart(2, '0')}`,
      isoNow,
      isoNow
    );
    insertSub.run(uuidv4(), mId, i % 2 === 0 ? 'monthly' : 'yearly', 'active', isoNow, nextMonth.toISOString(), isoNow, isoNow);
  }

  // 3. Charities (6 rich, realistic entries)
  const charities = [
    {
      id: uuidv4(),
      name: 'Youth on Course Alliance',
      slug: 'youth-on-course',
      mission: 'Providing subsidized rounds, leadership development, and life skills for young golfers from underrepresented backgrounds.',
      description: 'The Youth on Course Alliance believes that financial barriers should never keep a young person away from the integrity and discipline of the game. We subsidize rounds to $5 or less for over 140,000 youth across North America.',
      category: 'Youth & Education',
      logo_url: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=100&auto=format&fit=crop&q=80',
      hero_image_url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&auto=format&fit=crop&q=80',
      website: 'https://youthoncourse.org',
      is_featured: 1,
      upcoming_events: JSON.stringify([
        { id: uuidv4(), title: 'Annual Junior Invitational', date: '2026-10-15', location: 'St. Andrews Youth Academy', description: 'Showcase tournament for 100 junior scholars.' },
        { id: uuidv4(), title: 'STEM On The Green Clinic', date: '2026-11-04', location: 'Metropolitan Community Center', description: 'Teaching physics and geometry through ball flight dynamics.' }
      ]),
      impact_metrics: JSON.stringify([
        { label: 'Rounds Subsidized', value: '142,500+' },
        { label: 'College Scholarships', value: '$2.8M' },
        { label: 'Youth Reached', value: '19,400' }
      ]),
    },
    {
      id: uuidv4(),
      name: 'Veterans Fairway Rehabilitation',
      slug: 'veterans-fairway',
      mission: 'Empowering wounded military veterans and first responders through therapeutic recreational programs and community peer support.',
      description: 'Veterans Fairway Rehabilitation connects injured service members with certified physical therapists and PGA professionals to aid in emotional healing, physical recovery, and camaraderie.',
      category: 'Veterans & Health',
      logo_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=100&auto=format&fit=crop&q=80',
      hero_image_url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&auto=format&fit=crop&q=80',
      website: 'https://veteransfairway.org',
      is_featured: 1,
      upcoming_events: JSON.stringify([
        { id: uuidv4(), title: 'Honor & Recovery Classic', date: '2026-10-28', location: 'Pine Valley Memorial Course', description: 'Fundraising scramble pairing veterans with civic leaders.' }
      ]),
      impact_metrics: JSON.stringify([
        { label: 'Veterans Supported', value: '4,800+' },
        { label: 'Therapy Sessions', value: '12,400' },
        { label: 'Adaptive Kits Funded', value: '620' }
      ]),
    },
    {
      id: uuidv4(),
      name: 'Green Fairways Eco-Preserve',
      slug: 'green-fairways',
      mission: 'Pioneering biodiversity conservation, pollinator corridors, and zero-runoff water management across recreational landscapes.',
      description: 'Green Fairways works directly with environmental scientists to transform course open spaces into thriving sanctuaries for native flora, bees, and migratory bird species.',
      category: 'Environment',
      logo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100&auto=format&fit=crop&q=80',
      hero_image_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
      website: 'https://greenfairways.org',
      is_featured: 0,
      upcoming_events: JSON.stringify([
        { id: uuidv4(), title: 'Wetlands Planting Day', date: '2026-10-10', location: 'Evergreen Wildlife Sanctuary', description: 'Planting 2,500 native marsh grasses to filter natural runoff.' }
      ]),
      impact_metrics: JSON.stringify([
        { label: 'Acres Protected', value: '8,500' },
        { label: 'Water Saved (Gallons)', value: '34 Million' },
        { label: 'Native Trees Planted', value: '45,000' }
      ]),
    },
    {
      id: uuidv4(),
      name: 'Adaptive Golf Worldwide',
      slug: 'adaptive-golf',
      mission: 'Eliminating boundaries for athletes with mobility impairments, visual impairment, and neurological challenges.',
      description: 'Adaptive Golf Worldwide provides specialized paramobile solo-rider carts, tactile equipment, and accessible clinics to make sport inclusive for everyone.',
      category: 'Accessibility',
      logo_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&auto=format&fit=crop&q=80',
      hero_image_url: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=1200&auto=format&fit=crop&q=80',
      website: 'https://adaptivegolf.org',
      is_featured: 1,
      upcoming_events: JSON.stringify([
        { id: uuidv4(), title: 'Para-Champions Open', date: '2026-11-18', location: 'Sun Valley Accessible Resort', description: 'International tournament celebrating adaptive athletes.' }
      ]),
      impact_metrics: JSON.stringify([
        { label: 'Athletes Equipped', value: '2,150' },
        { label: 'Paramobiles Distributed', value: '185' },
        { label: 'Clinics Hosted', value: '410' }
      ]),
    },
    {
      id: uuidv4(),
      name: 'Clean Water Relief Initiative',
      slug: 'clean-water-relief',
      mission: 'Delivering sustainable freshwater infrastructure and solar-powered filtration systems to remote communities.',
      description: 'Clean Water Relief partners with global non-profits to drill solar-powered deep wells and install UV purification stations in underserved drought regions.',
      category: 'Global Aid',
      logo_url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=100&auto=format&fit=crop&q=80',
      hero_image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=1200&auto=format&fit=crop&q=80',
      website: 'https://cleanwaterrelief.org',
      is_featured: 0,
      upcoming_events: JSON.stringify([
        { id: uuidv4(), title: 'Clean Water Gala & Auction', date: '2026-12-05', location: 'Grand Horizon Pavilion', description: 'Fundraising dinner funding 15 community borehole wells.' }
      ]),
      impact_metrics: JSON.stringify([
        { label: 'People Served', value: '280,000+' },
        { label: 'Wells Drilled', value: '340' },
        { label: 'Filtration Units', value: '1,200' }
      ]),
    },
    {
      id: uuidv4(),
      name: 'Urban Food Forest Network',
      slug: 'urban-food-forest',
      mission: 'Transforming urban vacant lots and neglected peripheries into perennial organic edible food forests.',
      description: 'Combating food insecurity in urban food deserts by creating community-maintained agroforestry hubs providing free fresh produce to neighboring families.',
      category: 'Community',
      logo_url: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=100&auto=format&fit=crop&q=80',
      hero_image_url: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1200&auto=format&fit=crop&q=80',
      website: 'https://urbanfoodforest.org',
      is_featured: 0,
      upcoming_events: [],
      impact_metrics: JSON.stringify([
        { label: 'Lbs Fresh Produce Harvested', value: '120,000+' },
        { label: 'Community Hubs', value: '48' }
      ]),
    }
  ];

  const insertCharity = db.prepare(`
    INSERT INTO charities (id, name, slug, mission, description, category, logo_url, hero_image_url, website, is_featured, is_active, upcoming_events, impact_metrics, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `);

  for (const c of charities) {
    insertCharity.run(
      c.id,
      c.name,
      c.slug,
      c.mission,
      c.description,
      c.category,
      c.logo_url,
      c.hero_image_url,
      c.website,
      c.is_featured,
      c.upcoming_events,
      c.impact_metrics,
      isoNow,
      isoNow
    );
  }

  // 4. User Charity Selections (Min 10%)
  const insertUserCharity = db.prepare(`
    INSERT INTO user_charities (id, user_id, charity_id, contribution_percentage, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUserCharity.run(uuidv4(), subscriberId, charities[0].id, 15, isoNow, isoNow); // 15% contribution
  insertUserCharity.run(uuidv4(), winnerUserId, charities[1].id, 20, isoNow, isoNow); // 20% contribution

  // Assign charities for mock subscribers
  for (let i = 0; i < mockSubIds.length; i++) {
    const cIdx = i % charities.length;
    const pct = 10 + (i % 3) * 5; // 10%, 15%, or 20%
    insertUserCharity.run(uuidv4(), mockSubIds[i], charities[cIdx].id, pct, isoNow, isoNow);
  }

  // 5. Scores (5 latest Stableford scores per subscriber)
  const insertScore = db.prepare(`
    INSERT INTO scores (id, user_id, score, score_date, course_name, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Marcus Reed's scores (demo subscriber)
  const marcusScores = [
    { score: 38, date: '2026-09-18', course: 'Torrey Pines South', notes: 'Great back nine putting!' },
    { score: 34, date: '2026-09-12', course: 'Pebble Beach Links', notes: 'Breezy conditions, solid irons' },
    { score: 36, date: '2026-09-05', course: 'Bandon Dunes', notes: 'Stableford personal record on front 9' },
    { score: 31, date: '2026-08-28', course: 'Spyglass Hill', notes: 'Tough pin placements' },
    { score: 39, date: '2026-08-20', course: 'Cypress Point', notes: 'Clean round, no penalty strokes' },
  ];

  for (const s of marcusScores) {
    insertScore.run(uuidv4(), subscriberId, s.score, s.date, s.course, s.notes, isoNow, isoNow);
  }

  // David Miller's scores (winner)
  const winnerScores = [
    { score: 42, date: '2026-09-14', course: 'Augusta National Heritage', notes: 'Unreal short game' },
    { score: 37, date: '2026-09-08', course: 'Pinehurst No. 2', notes: 'Consistent pars' },
    { score: 35, date: '2026-08-30', course: 'Oakmont Country Club', notes: 'Deep sand saves' },
    { score: 33, date: '2026-08-22', course: 'Bethpage Black', notes: 'Demanding fairways' },
    { score: 38, date: '2026-08-15', course: 'Whistling Straits', notes: 'Windy day recovery' },
  ];

  for (const s of winnerScores) {
    insertScore.run(uuidv4(), winnerUserId, s.score, s.date, s.course, s.notes, isoNow, isoNow);
  }

  // Populate 5 scores for each mock subscriber
  for (const subId of mockSubIds) {
    const baseScores = [31, 33, 35, 37, 38];
    for (let day = 1; day <= 5; day++) {
      const scoreVal = baseScores[day - 1] + Math.floor(Math.random() * 5) - 2;
      const cleanScore = Math.max(1, Math.min(45, scoreVal));
      insertScore.run(
        uuidv4(),
        subId,
        cleanScore,
        `2026-09-${(10 + day).toString().padStart(2, '0')}`,
        'Highland Hills Golf Club',
        'Weekend medal round',
        isoNow,
        isoNow
      );
    }
  }

  // 6. Draws
  // A. Past Completed Draw: Draw #101 (August 2026)
  const pastDrawId = uuidv4();
  const pastDrawNumbers = [33, 35, 37, 38, 42]; // David Miller matches 5 numbers!
  const insertDraw = db.prepare(`
    INSERT INTO draws (id, draw_number, draw_date, month_year, status, method, winning_numbers, jackpot_rollover_cents, total_prize_pool_cents, published_at, published_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDraw.run(
    pastDrawId,
    101,
    '2026-08-31T20:00:00.000Z',
    '2026-08',
    'completed',
    'random',
    JSON.stringify(pastDrawNumbers),
    50000, // $500 prior rollover
    220000, // $2,200 total pool
    '2026-08-31T20:05:00.000Z',
    adminId,
    '2026-08-01T00:00:00.000Z',
    isoNow
  );

  // Prize pool for Draw #101
  db.prepare(`
    INSERT INTO prize_pools (
      id, draw_id, total_pool_cents, subscriber_contribution_cents, rollover_in_cents, rollover_out_cents,
      tier_5_pool_cents, tier_4_pool_cents, tier_3_pool_cents,
      tier_5_winner_count, tier_4_winner_count, tier_3_winner_count,
      tier_5_payout_per_winner_cents, tier_4_payout_per_winner_cents, tier_3_payout_per_winner_cents,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    pastDrawId,
    220000,
    170000,
    50000,
    0,
    118000, // 40% of 170000 (68000) + 50000 rollover = 118000
    59500,  // 35% of 170000
    42500,  // 25% of 170000
    1, // 1 five-match winner (David Miller)
    2, // 2 four-match winners
    4, // 4 three-match winners
    118000,
    29750,
    10625,
    '2026-08-31T20:05:00.000Z'
  );

  // Draw Entries for past draw
  const winnerEntryId = uuidv4();
  db.prepare(`
    INSERT INTO draw_entries (id, draw_id, user_id, numbers, matched_numbers, match_count, prize_tier, is_winner, created_at)
    VALUES (?, ?, ?, ?, ?, 5, 'five_match', 1, '2026-08-31T19:50:00.000Z')
  `).run(
    winnerEntryId,
    pastDrawId,
    winnerUserId,
    JSON.stringify([42, 37, 35, 33, 38]),
    JSON.stringify(pastDrawNumbers),
  );

  // Marcus Reed entry in past draw (matched 3 numbers: 31, 36, 39 vs 33, 35, 37, 38, 42 -> 0 or 1 match)
  const marcusPastEntryId = uuidv4();
  db.prepare(`
    INSERT INTO draw_entries (id, draw_id, user_id, numbers, matched_numbers, match_count, prize_tier, is_winner, created_at)
    VALUES (?, ?, ?, ?, ?, 1, NULL, 0, '2026-08-31T19:50:00.000Z')
  `).run(
    marcusPastEntryId,
    pastDrawId,
    subscriberId,
    JSON.stringify([38, 34, 36, 31, 39]),
    JSON.stringify([38]),
  );

  // Winner record 1: David Miller (Paid)
  const paidWinnerId = uuidv4();
  db.prepare(`
    INSERT INTO winners (
      id, draw_id, user_id, entry_id, prize_tier, prize_amount_cents,
      verification_status, payout_status, proof_url, proof_file_name, proof_uploaded_at,
      reviewed_by, reviewed_at, review_notes, paid_at, payout_reference, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'five_match', 118000, 'approved', 'paid', ?, 'official_scorecard_august.jpg', ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    paidWinnerId,
    pastDrawId,
    winnerUserId,
    winnerEntryId,
    'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&auto=format&fit=crop&q=80',
    '2026-09-01T10:00:00.000Z',
    adminId,
    '2026-09-01T14:30:00.000Z',
    'Official handicap platform scorecard verified. Match confirmed.',
    '2026-09-02T09:00:00.000Z',
    'PAY-20260902-88219',
    '2026-08-31T20:05:00.000Z',
    isoNow
  );

  // Winner record 2: Another winner pending verification for test
  const pendingWinnerEntryId = uuidv4();
  db.prepare(`
    INSERT INTO draw_entries (id, draw_id, user_id, numbers, matched_numbers, match_count, prize_tier, is_winner, created_at)
    VALUES (?, ?, ?, ?, ?, 4, 'four_match', 1, '2026-08-31T19:50:00.000Z')
  `).run(
    pendingWinnerEntryId,
    pastDrawId,
    mockSubIds[0],
    JSON.stringify([33, 35, 37, 38, 20]),
    JSON.stringify([33, 35, 37, 38]),
  );

  db.prepare(`
    INSERT INTO winners (
      id, draw_id, user_id, entry_id, prize_tier, prize_amount_cents,
      verification_status, payout_status, proof_url, proof_file_name, proof_uploaded_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'four_match', 29750, 'pending', 'pending', ?, 'proof_card_mobile.png', ?, ?, ?)
  `).run(
    uuidv4(),
    pastDrawId,
    mockSubIds[0],
    pendingWinnerEntryId,
    'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800&auto=format&fit=crop&q=80',
    '2026-09-03T11:00:00.000Z',
    '2026-08-31T20:05:00.000Z',
    isoNow
  );

  // B. Current Active/Upcoming Draw: Draw #102 (September 2026)
  const upcomingDrawId = uuidv4();
  insertDraw.run(
    upcomingDrawId,
    102,
    '2026-09-30T20:00:00.000Z',
    '2026-09',
    'draft',
    'random',
    '[]',
    75000, // $750 jackpot rollover
    245000, // $2,450 estimated pool
    null,
    null,
    isoNow,
    isoNow
  );

  // 7. Independent Donations
  const insertDonation = db.prepare(`
    INSERT INTO donations (id, user_id, charity_id, amount_cents, frequency, donor_name, donor_email, status, is_independent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'succeeded', 1, ?)
  `);

  insertDonation.run(uuidv4(), subscriberId, charities[0].id, 5000, 'one_off', 'Marcus Reed', 'subscriber@digitalheroes.test', isoNow);
  insertDonation.run(uuidv4(), null, charities[1].id, 10000, 'monthly', 'Anonymous Donor', 'patron@impact.org', isoNow);
  insertDonation.run(uuidv4(), null, charities[3].id, 2500, 'one_off', 'Sarah Jenkins', 'sjenkins@gmail.com', isoNow);

  console.log('✅ Digital Heroes seed complete!');
  console.log('----------------------------------------------------');
  console.log('Demo Accounts:');
  console.log('1. Admin:      admin@digitalheroes.test      / Admin123!');
  console.log('2. Subscriber: subscriber@digitalheroes.test / Password123!');
  console.log('3. Inactive:   inactive@digitalheroes.test   / Password123!');
  console.log('4. Winner:     winner@digitalheroes.test     / Password123!');
  console.log('----------------------------------------------------');
}

// Auto-run if executed directly
if (process.env.npm_lifecycle_event === 'seed' || process.argv[1]?.includes('seedData')) {
  seed()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
