import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';
import { Winner } from '../../../../shared/types';
import { useToast } from '../../contexts/ToastContext';
import { formatCents, prizeTierLabel } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';

export function WinningsPage() {
  const { success, error } = useToast();
  const [winners, setWinners] = useState<Winner[]>([]);

  const load = () => api.winners.getUserWinnings().then(setWinners).catch(() => setWinners([]));

  useEffect(() => {
    load();
  }, []);

  const upload = async (id: string, file: File) => {
    try {
      const form = new FormData();
      form.append('proof_image', file);
      await api.winners.uploadProof(id, form);
      success('Proof uploaded. Status remains pending until an admin reviews it.');
      await load();
    } catch (err: any) {
      error(err.message);
    }
  };

  const total = winners.reduce((sum, w) => sum + w.prize_amount_cents, 0);
  const pending = winners.filter(w => w.verification_status === 'pending');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-black">Winnings</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-slate-400">Total prizes</p>
          <p className="text-xl font-bold">{formatCents(total)}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Pending verification</p>
          <p className="text-xl font-bold">{pending.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Paid</p>
          <p className="text-xl font-bold">{winners.filter(w => w.payout_status === 'paid').length}</p>
        </Card>
      </div>
      {winners.length === 0 ? (
        <EmptyState title="No winnings yet" description="When you match 3, 4, or 5 numbers, proof upload and payout tracking appear here." />
      ) : (
        <div className="space-y-4">
          {winners.map(winner => (
            <Card key={winner.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{prizeTierLabel(winner.prize_tier)}</p>
                  <p className="text-sm text-slate-400">{formatCents(winner.prize_amount_cents)}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={winner.verification_status === 'approved' ? 'emerald' : winner.verification_status === 'rejected' ? 'rose' : 'amber'}>
                    {winner.verification_status}
                  </Badge>
                  <Badge variant={winner.payout_status === 'paid' ? 'gold' : 'slate'}>{winner.payout_status}</Badge>
                </div>
              </div>
              {winner.review_notes && <p className="mt-3 text-sm text-slate-400">Admin notes: {winner.review_notes}</p>}
              {winner.verification_status !== 'approved' && (
                <label className="mt-4 inline-block">
                  <span className="text-xs text-slate-400">Upload score screenshot (JPEG/PNG, max 10MB)</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="mt-2 block text-sm"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) upload(winner.id, file);
                    }}
                  />
                </label>
              )}
              {winner.proof_url && (
                <a className="mt-3 inline-block text-xs text-emerald-400" href={winner.proof_url} target="_blank" rel="noreferrer">
                  View uploaded proof
                </a>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
