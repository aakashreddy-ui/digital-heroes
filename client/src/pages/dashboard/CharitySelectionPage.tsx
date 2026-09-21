import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/client';
import { Charity, IndependentDonation, UserCharitySelection } from '../../../../shared/types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCents } from '../../lib/utils';

export function CharitySelectionPage() {
  const { refreshProfile } = useAuth();
  const { success, error } = useToast();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [selection, setSelection] = useState<UserCharitySelection | null>(null);
  const [percentage, setPercentage] = useState(10);
  const [charityId, setCharityId] = useState('');
  const [donations, setDonations] = useState<IndependentDonation[]>([]);

  useEffect(() => {
    api.charities.getAll().then(setCharities).catch(console.error);
    api.charities.getUserSelection().then(sel => {
      setSelection(sel);
      if (sel) {
        setCharityId(sel.charity_id);
        setPercentage(sel.contribution_percentage);
      }
    }).catch(() => undefined);
    api.donations.getUserDonations().then(setDonations).catch(() => setDonations([]));
  }, []);

  const save = async () => {
    try {
      const updated = await api.charities.setUserSelection({
        charity_id: charityId,
        contribution_percentage: percentage,
      });
      setSelection(updated);
      await refreshProfile();
      success('Charity contribution updated');
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-black">My charity</h1>
      <Card>
        <p className="text-sm text-slate-400 mb-4">
          Subscription contributions start at 10% of your plan fee and can be increased. Independent donations stay separate from gameplay.
        </p>
        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Selected charity</label>
        <select
          className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2.5 text-sm"
          value={charityId}
          onChange={e => setCharityId(e.target.value)}
        >
          <option value="">Choose a charity</option>
          {charities.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="block text-xs uppercase tracking-wider text-slate-400 mt-4 mb-2">
          Contribution {percentage}%
        </label>
        <input
          type="range"
          min={10}
          max={100}
          value={percentage}
          onChange={e => setPercentage(Number(e.target.value))}
          className="w-full"
        />
        <Button className="mt-5" onClick={save} disabled={!charityId}>
          Save selection
        </Button>
        {selection?.charity && (
          <p className="mt-4 text-sm text-emerald-300">Currently supporting {selection.charity.name}</p>
        )}
      </Card>
      <Card>
        <h2 className="font-bold mb-3">Independent donations</h2>
        {donations.length === 0 ? (
          <p className="text-sm text-slate-500">No independent gifts yet. These never enter the prize pool.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {donations.map(d => (
              <li key={d.id} className="flex justify-between border-b border-white/5 pb-2">
                <span>{d.charity_name || d.charity_id}</span>
                <span>{formatCents(d.amount_cents)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
