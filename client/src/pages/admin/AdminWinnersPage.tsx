import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';
import { Winner } from '../../../../shared/types';
import { useToast } from '../../contexts/ToastContext';
import { formatCents, prizeTierLabel } from '../../lib/utils';

export function AdminWinnersPage() {
  const { success, error } = useToast();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    const rows = await api.winners.adminGetAll({
      verification_status: status || undefined,
    });
    setWinners(rows);
  };

  useEffect(() => {
    load().catch(console.error);
  }, [status]);

  const verify = async (id: string, approved: boolean) => {
    try {
      await api.winners.adminVerify(id, approved, notes[id] || '');
      success(approved ? 'Winner approved' : 'Winner rejected');
      await load();
    } catch (err: any) {
      error(err.message);
    }
  };

  const payout = async (id: string) => {
    try {
      await api.winners.adminPayout(id, `PAY-${Date.now()}`);
      success('Payout marked paid');
      await load();
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-black">Winner verification</h1>
      <select className="rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="">All verification states</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <div className="space-y-4">
        {winners.map(winner => (
          <Card key={winner.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-bold">{winner.user_name || winner.user_id}</p>
                <p className="text-sm text-slate-400">
                  Draw #{winner.draw_number} · {prizeTierLabel(winner.prize_tier)} · {formatCents(winner.prize_amount_cents)}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant={winner.verification_status === 'approved' ? 'emerald' : winner.verification_status === 'rejected' ? 'rose' : 'amber'}>
                  {winner.verification_status}
                </Badge>
                <Badge variant={winner.payout_status === 'paid' ? 'gold' : 'slate'}>{winner.payout_status}</Badge>
              </div>
            </div>
            {winner.proof_url ? (
              <a className="mt-3 inline-block text-sm text-emerald-400" href={winner.proof_url} target="_blank" rel="noreferrer">
                View proof
              </a>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No proof uploaded yet.</p>
            )}
            {winner.review_notes && <p className="mt-2 text-sm text-slate-400">Notes: {winner.review_notes}</p>}
            <Input
              className="mt-3"
              label="Review notes"
              value={notes[winner.id] || ''}
              onChange={e => setNotes({ ...notes, [winner.id]: e.target.value })}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => verify(winner.id, true)}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => verify(winner.id, false)}>
                Reject
              </Button>
              <Button size="sm" variant="gold" onClick={() => payout(winner.id)}>
                Mark payout paid
              </Button>
            </div>
          </Card>
        ))}
        {winners.length === 0 && <p className="text-sm text-slate-500">No winners match this filter.</p>}
      </div>
    </div>
  );
}
