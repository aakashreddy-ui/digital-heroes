import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';
import { Charity, Draw } from '../../../../shared/types';
import {
  Heart,
  Trophy,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
  ChevronDown,
  Gift,
} from 'lucide-react';

export function HomePage() {
  const [featuredCharities, setFeaturedCharities] = useState<Charity[]>([]);
  const [upcomingDraw, setUpcomingDraw] = useState<Draw | null>(null);
  const [calculatorPct, setCalculatorPct] = useState<number>(20);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    api.charities.getAll({ featured: true }).then(setFeaturedCharities).catch(console.error);
    api.draws.getUpcoming().then(setUpcomingDraw).catch(console.error);
  }, []);

  const totalPrizeDisplay = upcomingDraw
    ? `$${((upcomingDraw.jackpot_rollover_cents + 170000) / 100).toLocaleString()}`
    : '$2,450';

  const rolloverDisplay = upcomingDraw
    ? `$${(upcomingDraw.jackpot_rollover_cents / 100).toLocaleString()}`
    : '$750';

  const faqs = [
    {
      q: 'How does my subscription benefit charities?',
      a: 'A minimum of 10% of every monthly or yearly subscription fee goes directly to your selected charity partner. You can choose to voluntarily increase this percentage up to 100%. Funds are disbursed monthly to verified 501(c)(3) organizations.',
    },
    {
      q: 'How does the Stableford score draw work?',
      a: 'You enter your recent 18-hole Stableford scores (ranging from 1 to 45 points). Only your latest 5 scores are active. In the monthly draw, 5 winning numbers are drawn. If your scores match 5, 4, or 3 numbers, you win a share of that tier’s cash prize pool!',
    },
    {
      q: 'What happens if no one matches all 5 numbers?',
      a: 'The 5-number Tier 1 jackpot (40% of the subscription pool) rolls over into the next month’s draw, creating massive escalating jackpots! The 4-number (35%) and 3-number (25%) prizes do not roll over and are distributed to matching winners.',
    },
    {
      q: 'How are winners verified before payout?',
      a: 'Winners upload a screenshot of their official handicap or scoring app scorecard for the matching dates. Our administrators verify the scores against official platform records. Once approved, payouts are processed directly via bank transfer.',
    },
    {
      q: 'Can I make independent donations without playing?',
      a: 'Yes! Digital Heroes supports 100% independent donations directly to any partner charity, completely separate from subscription gameplay and prize draws.',
    },
  ];

  return (
    <div className="min-h-screen bg-hero-bg text-slate-100 flex flex-col selection:bg-hero-emerald selection:text-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-32 md:pb-40 border-b border-white/10">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Emotional pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-8 shadow-glow-emerald animate-pulse-slow">
            <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
            <span>Transforming Game Passion Into Real Charitable Hope</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight leading-[1.1] max-w-5xl mx-auto">
            Play with Purpose. <br />
            <span className="gradient-hero-title">Empower Verified Charities.</span> <br />
            <span className="gradient-gold-title">Win Monthly Jackpots.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Digital Heroes is the revolutionary charity-first platform where your Stableford golf scores enter you into monthly cash draws while funding youth, veteran, and environmental organizations across the globe.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/pricing">
              <Button variant="primary" size="lg" className="w-full sm:w-auto text-base">
                Join the Heroes Movement
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                Explore Draw Mechanics
              </Button>
            </Link>
          </div>

          {/* Live Platform Stats Ticker */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
              <p className="text-2xl sm:text-3xl font-black text-white">{totalPrizeDisplay}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Est. Next Prize Pool</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 text-center">
              <p className="text-2xl sm:text-3xl font-black text-amber-400">{rolloverDisplay}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Jackpot Rollover In</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 text-center">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">10% - 100%</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Direct Charity Funding</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
              <p className="text-2xl sm:text-3xl font-black text-white">40 / 35 / 25</p>
              <p className="text-xs text-slate-400 font-medium mt-1">3 Match Prize Tiers</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Journey Section */}
      <section className="py-24 border-b border-white/10 bg-[#0A0E17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="emerald" size="md" className="mb-3">
              Simple 5-Step Loop
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
              How Digital Heroes Works
            </h2>
            <p className="mt-4 text-slate-400">
              A transparent, auditable cycle combining personal sporting achievement with meaningful social impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              {
                step: '01',
                title: 'Subscribe & Select',
                desc: 'Pick a monthly or annual plan. Select the verified charity you want to support (min 10%).',
                icon: Heart,
                color: 'text-emerald-400',
              },
              {
                step: '02',
                title: 'Play & Score',
                desc: 'Play golf on your favorite courses using the standard Stableford points system (1 to 45).',
                icon: Trophy,
                color: 'text-sky-400',
              },
              {
                step: '03',
                title: 'Track Latest 5',
                desc: 'Enter your scores with dates. Your latest 5 scores are automatically retained as your draw entry.',
                icon: Layers,
                color: 'text-purple-400',
              },
              {
                step: '04',
                title: 'Monthly Draw',
                desc: 'On the final day of each month, 5 winning numbers are revealed. Match 3, 4, or 5 to win!',
                icon: Sparkles,
                color: 'text-amber-400',
              },
              {
                step: '05',
                title: 'Verify & Win',
                desc: 'Upload your scorecard proof. Admin verifies the match, and cash payout is sent directly to you.',
                icon: Shield,
                color: 'text-emerald-400',
              },
            ].map(item => (
              <div
                key={item.step}
                className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-emerald-500/30 transition-all hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-slate-500">{item.step}</span>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Charities Showcase */}
      <section className="py-24 border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <Badge variant="gold" size="md" className="mb-3">
                Real World Impact
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
                Featured Charities You Fund
              </h2>
              <p className="mt-3 text-slate-400 max-w-xl">
                Every subscription puts direct resources in the hands of organizations fostering youth equity, wounded veteran rehabilitation, and eco-restoration.
              </p>
            </div>
            <Link to="/charities">
              <Button variant="outline" size="md">
                View All Charities
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCharities.map(charity => (
              <Card key={charity.id} hover glow="none" className="flex flex-col justify-between overflow-hidden group">
                <div>
                  <div className="relative h-48 -mx-6 -mt-6 mb-5 overflow-hidden">
                    <img
                      src={charity.hero_image_url}
                      alt={charity.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                    <Badge variant="emerald" className="absolute top-4 left-4">
                      {charity.category}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{charity.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">{charity.mission}</p>

                  {/* Impact metrics chips */}
                  {charity.impact_metrics && charity.impact_metrics.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 mb-4">
                      {charity.impact_metrics.slice(0, 2).map((m, idx) => (
                        <div key={idx} className="bg-white/5 p-2 rounded-xl text-center">
                          <p className="text-xs font-bold text-emerald-400">{m.value}</p>
                          <p className="text-[10px] text-slate-400 truncate">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Link to={`/charities/${charity.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Learn More & Support
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Interactive Charity Contribution Slider Preview */}
          <div className="mt-16 glass-panel p-8 rounded-3xl border border-emerald-500/20 max-w-4xl mx-auto bg-gradient-to-br from-emerald-950/20 to-slate-900/60">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2 text-left">
                <Badge variant="emerald" size="sm">
                  Interactive Impact Calculator
                </Badge>
                <h3 className="text-xl font-bold text-white">Adjust Your Contribution Percentage</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Digital Heroes enforces a 10% minimum contribution. You have complete control to voluntarily allocate up to 100% of your membership fee to your chosen charity.
                </p>
              </div>

              <div className="w-full md:w-80 bg-slate-900/80 p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Contribution Rate:</span>
                  <span className="font-bold text-emerald-400 text-lg">{calculatorPct}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={calculatorPct}
                  onChange={e => setCalculatorPct(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="pt-3 border-t border-white/5 flex justify-between text-xs">
                  <span className="text-slate-400">On $25/mo plan:</span>
                  <span className="font-bold text-white text-sm">
                    ${((25 * calculatorPct) / 100).toFixed(2)}/mo to charity
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stableford Score FIFO Preview Section */}
      <section className="py-24 border-b border-white/10 bg-[#090D15]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="blue" size="md">
                Stableford Score Management
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
                Automatic 5-Score FIFO Engine
              </h2>
              <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                In Digital Heroes, only your latest 5 Stableford scores (between 1 and 45 points) are retained. Every score requires a distinct date.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                When you play a new round and add your sixth score, our backend automatically removes your oldest stored round, keeping your draw entry active, current, and aligned with your real game performance.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Scores range strictly from 1 to 45 Stableford points</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Duplicate dates are rejected to protect competition integrity</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Automatic reverse chronological ordering (newest displayed first)</span>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/dashboard/scores">
                  <Button variant="primary" size="md">
                    Try Score Tracking
                  </Button>
                </Link>
              </div>
            </div>

            {/* FIFO Visual Demo Box */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-glass">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-white text-sm">Active 5-Score Draw Entry</span>
                </div>
                <Badge variant="emerald">Live Preview</Badge>
              </div>

              <div className="space-y-2.5">
                {[
                  { date: 'Sep 25', score: 40, course: 'Pebble Beach Links', status: 'Active (Newest)', isNew: true },
                  { date: 'Sep 20', score: 34, course: 'Torrey Pines South', status: 'Active' },
                  { date: 'Sep 15', score: 39, course: 'Bandon Dunes', status: 'Active' },
                  { date: 'Sep 10', score: 28, course: 'Spyglass Hill', status: 'Active' },
                  { date: 'Sep 05', score: 35, course: 'Cypress Point', status: 'Active' },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      s.isNew
                        ? 'bg-emerald-950/40 border-emerald-500/40 shadow-glow-emerald'
                        : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white text-sm">
                        {s.score}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{s.course}</p>
                        <p className="text-[10px] text-slate-400">{s.date}, 2026</p>
                      </div>
                    </div>
                    <Badge variant={s.isNew ? 'emerald' : 'slate'} size="sm">
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Expired Oldest Score indicator */}
              <div className="mt-4 p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 flex items-center justify-between text-xs text-rose-300">
                <span className="line-through">Sep 01 • 31 Points • Automatically replaced</span>
                <span className="text-[10px] uppercase font-bold text-rose-400">FIFO Removed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prize Pool & Draw Mechanics Section */}
      <section className="py-24 border-b border-white/10 bg-[#070A10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="gold" size="md" className="mb-3">
              Prize Pool Mathematics
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
              40% / 35% / 25% Prize Distribution
            </h2>
            <p className="mt-4 text-slate-400 text-sm sm:text-base">
              Subscription funds directly power the monthly cash prize pool. Winnings are distributed strictly across three winning match tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card glow="gold" className="text-center relative">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-4 border border-amber-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <Badge variant="gold" className="mb-2">
                Tier 1 Match
              </Badge>
              <h3 className="text-2xl font-black text-white">5 Numbers</h3>
              <p className="text-4xl font-display font-black text-amber-400 my-3">40%</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Matches all 5 drawn numbers. <strong>Jackpot rolls over</strong> to next month if unclaimed! Multiple winners split the tier equally.
              </p>
            </Card>

            <Card glow="none" className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400 mb-4 border border-sky-500/30">
                <Gift className="w-6 h-6" />
              </div>
              <Badge variant="blue" className="mb-2">
                Tier 2 Match
              </Badge>
              <h3 className="text-2xl font-black text-white">4 Numbers</h3>
              <p className="text-4xl font-display font-black text-sky-400 my-3">35%</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Matches 4 of the 5 drawn numbers. Does not roll over. Split equally among all 4-match participants.
              </p>
            </Card>

            <Card glow="none" className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <Badge variant="emerald" className="mb-2">
                Tier 3 Match
              </Badge>
              <h3 className="text-2xl font-black text-white">3 Numbers</h3>
              <p className="text-4xl font-display font-black text-emerald-400 my-3">25%</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Matches 3 of the 5 drawn numbers. Does not roll over. Split equally among all 3-match participants.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 border-b border-white/10 bg-[#090D15]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="emerald" size="md" className="mb-3">
              Transparent Membership
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
              Choose Your Hero Plan
            </h2>
            <p className="mt-4 text-slate-400 text-sm sm:text-base">
              Every plan funds your chosen charity and grants full entry into monthly cash draws.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly */}
            <Card hover glow="none" className="p-8 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Monthly Hero</h3>
                    <p className="text-xs text-slate-400 mt-1">Flexible month-to-month participation</p>
                  </div>
                  <Badge variant="slate">Monthly</Badge>
                </div>

                <div className="my-6">
                  <span className="text-4xl font-black text-white">$25</span>
                  <span className="text-slate-400 text-sm"> / month</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Track and edit your latest 5 Stableford scores</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Automatic entry into every monthly cash draw</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Minimum 10% directly funds your chosen charity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Eligible for 5, 4, and 3-number prize payouts</span>
                  </li>
                </ul>
              </div>

              <Link to="/pricing">
                <Button variant="outline" className="w-full">
                  Select Monthly
                </Button>
              </Link>
            </Card>

            {/* Yearly (Best Value) */}
            <Card hover glow="emerald" className="p-8 flex flex-col justify-between relative border-emerald-500/40">
              <div className="absolute -top-3.5 right-6">
                <Badge variant="gold" size="md">
                  Best Value (Save $50)
                </Badge>
              </div>

              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Annual Hero Patron</h3>
                    <p className="text-xs text-slate-400 mt-1">12 months of impact with 2 months free</p>
                  </div>
                  <Badge variant="emerald">Yearly</Badge>
                </div>

                <div className="my-6">
                  <span className="text-4xl font-black text-white">$250</span>
                  <span className="text-slate-400 text-sm"> / year</span>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">Includes 2 months free</p>
                </div>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>All Monthly Hero features included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Guaranteed 12 consecutive draw entries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Priority winner scorecard verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Hero Patron badge on charity leaderboards</span>
                  </li>
                </ul>
              </div>

              <Link to="/pricing">
                <Button variant="primary" className="w-full">
                  Join Annual Hero Plan
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 border-b border-white/10 bg-[#070A0F]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="slate" size="md" className="mb-3">
              Questions & Answers
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="glass-panel p-5 rounded-2xl border border-white/10 cursor-pointer transition-colors hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm sm:text-base font-bold text-white">{faq.q}</h4>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      activeFaq === idx ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </div>
                {activeFaq === idx && (
                  <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-hero-bg to-[#070A0F]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center shadow-glow-emerald border border-emerald-300/40 mb-6">
            <Shield className="w-8 h-8 text-slate-950 stroke-[2.5]" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight">
            Ready to Become a Digital Hero?
          </h2>
          <p className="mt-4 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Join thousands of golfers worldwide turning their weekend scores into philanthropic momentum. Play for cash jackpots while changing lives.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/pricing">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Get Started Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/charities">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Browse Partner Charities
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
