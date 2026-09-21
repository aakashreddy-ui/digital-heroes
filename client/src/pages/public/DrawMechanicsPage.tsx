import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';
import { Draw } from '../../../../shared/types';
import { formatCents, formatDate } from '../../lib/utils';

export function DrawMechanicsPage() {
  const [upcoming, setUpcoming] = useState<Draw | null>(null);
  const [latest, setLatest] = useState<Draw | null>(null);

  useEffect(() => {
    api.draws.getUpcoming().then(setUpcoming).catch(console.error);
    api.draws.getLatest().then(setLatest).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-hero-bg text-slate-100 flex flex-col">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-16 flex-1 space-y-8">
        <div>
          <Badge variant="gold">Prize mechanics</Badge>
          <h1 className="mt-3 text-4xl font-display font-black">Monthly draws, three prize tiers</h1>
          <p className="mt-3 text-slate-400">
            Your latest five Stableford scores become your five entry numbers (1–45). Matching 5, 4, or 3 winning numbers awards a share of that tier.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: '5-number match', pct: '40%', note: 'Jackpot rolls over if unclaimed' },
            { title: '4-number match', pct: '35%', note: 'No rollover. Split equally.' },
            { title: '3-number match', pct: '25%', note: 'No rollover. Split equally.' },
          ].map(tier => (
            <Card key={tier.title} glow="gold">
              <h2 className="font-bold">{tier.title}</h2>
              <p className="text-3xl font-black text-amber-300 mt-2">{tier.pct}</p>
              <p className="text-sm text-slate-400 mt-2">{tier.note}</p>
            </Card>
          ))}
        </div>
        <Card>
          <h2 className="font-bold">Draw methods</h2>
          <p className="mt-2 text-sm text-slate-400">
            Administrators may run a standard random lottery or an algorithmic weighted draw based on how frequently scores appear across the subscriber pool. Results are simulated first, then published once.
          </p>
        </Card>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-bold">Upcoming draw</h3>
            {upcoming ? (
              <div className="mt-3 text-sm text-slate-300 space-y-1">
                <p>Draw #{upcoming.draw_number} · {upcoming.month_year}</p>
                <p>Status: {upcoming.status}</p>
                <p>Date: {formatDate(upcoming.draw_date)}</p>
                <p>Rollover in: {formatCents(upcoming.jackpot_rollover_cents)}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No upcoming draw scheduled.</p>
            )}
          </Card>
          <Card>
            <h3 className="font-bold">Latest published result</h3>
            {latest ? (
              <div className="mt-3 text-sm text-slate-300 space-y-1">
                <p>Draw #{latest.draw_number}</p>
                <p>Winning numbers: {(latest.winning_numbers || []).join(', ') || '—'}</p>
                <p>Prize pool: {formatCents(latest.total_prize_pool_cents)}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No published draw yet.</p>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
