import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { formatCents, formatDate } from '../../lib/utils';
import { StablefordScore, Winner, Draw } from '../../../../shared/types';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function DashboardHomePage() {
  const { user, isSubscriber } = useAuth();
  const [scores, setScores] = useState<StablefordScore[]>([]);
  const [winnings, setWinnings] = useState<Winner[]>([]);
  const [upcoming, setUpcoming] = useState<Draw | null>(null);

  useEffect(() => {
    if (isSubscriber) {
      api.scores.getAll().then(setScores).catch(() => setScores([]));
      api.winners.getUserWinnings().then(setWinnings).catch(() => setWinnings([]));
    }
    api.draws.getUpcoming().then(setUpcoming).catch(() => setUpcoming(null));
  }, [isSubscriber]);

  const totalWinnings = winnings.reduce((sum, w) => sum + (w.prize_amount_cents || 0), 0);
  const chartData = [...scores].reverse().map(s => ({ date: formatDate(s.score_date), score: s.score }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black">Hello, {user?.full_name?.split(' ')[0]}</h1>
        <p className="text-slate-400 text-sm mt-1">Your impact, scores, and draw participation in one place.</p>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-slate-400">Subscription</p>
          <p className="mt-2 text-lg font-bold capitalize">{user?.subscription?.status || 'inactive'}</p>
          <p className="text-xs text-slate-500">{user?.subscription?.plan_id || 'No plan'}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Charity</p>
          <p className="mt-2 text-lg font-bold">{user?.selected_charity?.charity?.name || 'Not selected'}</p>
          <p className="text-xs text-slate-500">{user?.selected_charity?.contribution_percentage || 0}% of fees</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Active scores</p>
          <p className="mt-2 text-lg font-bold">{scores.length} / 5</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Verified winnings</p>
          <p className="mt-2 text-lg font-bold">{formatCents(totalWinnings)}</p>
        </Card>
      </div>
      {!isSubscriber && (
        <Card glow="gold">
          <p className="font-bold">Activate membership to enter draws</p>
          <p className="text-sm text-slate-400 mt-1">Score tracking and prize participation require an active subscription.</p>
          <Link to="/pricing">
            <Button className="mt-4">View plans</Button>
          </Link>
        </Card>
      )}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-bold mb-4">Score trend</h2>
          {chartData.length ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[1, 45]} stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#10B981" fill="#10B98133" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No scores yet.</p>
          )}
        </Card>
        <Card>
          <h2 className="font-bold">Next draw</h2>
          {upcoming ? (
            <div className="mt-3 space-y-2 text-sm">
              <Badge>{upcoming.status}</Badge>
              <p>Draw #{upcoming.draw_number} on {formatDate(upcoming.draw_date)}</p>
              <p>Rollover {formatCents(upcoming.jackpot_rollover_cents)}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mt-3">No upcoming draw.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
