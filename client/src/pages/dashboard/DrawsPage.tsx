import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';
import { Draw, DrawEntry } from '../../../../shared/types';
import { formatCents, formatDate, prizeTierLabel } from '../../lib/utils';

export function DrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [entries, setEntries] = useState<DrawEntry[]>([]);
  const [upcoming, setUpcoming] = useState<Draw | null>(null);

  useEffect(() => {
    api.draws.getAll().then(setDraws).catch(() => setDraws([]));
    api.draws.getUserEntries().then(setEntries).catch(() => setEntries([]));
    api.draws.getUpcoming().then(setUpcoming).catch(() => setUpcoming(null));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-black">Draw participation</h1>
      <Card>
        <h2 className="font-bold">Upcoming</h2>
        {upcoming ? (
          <p className="mt-2 text-sm text-slate-300">
            Draw #{upcoming.draw_number} on {formatDate(upcoming.draw_date)} · status {upcoming.status} · estimated pool{' '}
            {formatCents(upcoming.total_prize_pool_cents)}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No upcoming draw.</p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Active subscribers with five stored scores are entered automatically when an administrator publishes the draw.
        </p>
      </Card>
      <Card>
        <h2 className="font-bold mb-3">My entries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2">Draw</th>
                <th>Numbers</th>
                <th>Matches</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="border-t border-white/5">
                  <td className="py-2">{entry.draw_id.slice(0, 8)}</td>
                  <td>{(entry.numbers || []).join(', ')}</td>
                  <td>{entry.match_count}</td>
                  <td>
                    <Badge variant={entry.is_winner ? 'gold' : 'slate'}>{prizeTierLabel(entry.prize_tier)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && <p className="text-sm text-slate-500 py-4">No published entries yet.</p>}
        </div>
      </Card>
      <Card>
        <h2 className="font-bold mb-3">Previous draws</h2>
        <ul className="space-y-2 text-sm">
          {draws
            .filter(d => d.status === 'published' || d.status === 'completed')
            .map(draw => (
              <li key={draw.id} className="flex justify-between border-b border-white/5 pb-2">
                <span>
                  #{draw.draw_number} · {(draw.winning_numbers || []).join(', ')}
                </span>
                <span>{formatCents(draw.total_prize_pool_cents)}</span>
              </li>
            ))}
        </ul>
      </Card>
    </div>
  );
}
