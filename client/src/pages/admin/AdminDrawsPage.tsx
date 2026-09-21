import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../api/client';
import { Draw } from '../../../../shared/types';
import { useToast } from '../../contexts/ToastContext';
import { formatCents } from '../../lib/utils';

export function AdminDrawsPage() {
  const { success, error } = useToast();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [drawDate, setDrawDate] = useState('2026-10-31');
  const [monthYear, setMonthYear] = useState('2026-10');
  const [method, setMethod] = useState<'random' | 'algorithmic'>('random');
  const [rollover, setRollover] = useState('0');
  const [customNumbers, setCustomNumbers] = useState('33,35,37,38,42');
  const [simulation, setSimulation] = useState<any>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setDraws(await api.draws.getAll());
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const create = async () => {
    try {
      await api.draws.create({
        draw_date: new Date(drawDate).toISOString(),
        month_year: monthYear,
        method,
        jackpot_rollover_cents: Math.round(Number(rollover) * 100),
      });
      success('Draft draw created');
      setCreateOpen(false);
      await load();
    } catch (err: any) {
      error(err.message);
    }
  };

  const simulate = async (draw: Draw, selectedMethod: 'random' | 'algorithmic') => {
    setBusyId(draw.id);
    try {
      const result = await api.draws.simulate(draw.id, { method: selectedMethod });
      setSimulation(result);
      success('Simulation stored. Review before publishing.');
      await load();
    } catch (err: any) {
      error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const simulateCustom = async (draw: Draw) => {
    const numbers = customNumbers.split(',').map(value => Number(value.trim()));
    if (numbers.length !== 5 || numbers.some(number => !Number.isInteger(number) || number < 1 || number > 45) || new Set(numbers).size !== 5) {
      error('Enter exactly five unique numbers from 1 to 45.');
      return;
    }

    setBusyId(draw.id);
    try {
      const result = await api.draws.simulate(draw.id, { custom_numbers: numbers });
      setSimulation(result);
      success('Custom simulation stored. Review before publishing.');
      await load();
    } catch (err: any) {
      error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const publish = async (id: string) => {
    if (!confirm('Publish this draw? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await api.draws.publish(id);
      success('Draw published. Winners are now pending verification.');
      setSimulation(null);
      await load();
    } catch (err: any) {
      error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-black">Draws & simulation</h1>
          <p className="text-sm text-slate-400">Lifecycle: draft → simulation → published. Duplicate publish is blocked.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Configure draw</Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <Input
            label="Custom test numbers"
            value={customNumbers}
            onChange={e => setCustomNumbers(e.target.value)}
            placeholder="33,35,37,38,42"
          />
          <p className="text-xs text-slate-500 pb-2">Admin testing only: five unique values from 1 to 45.</p>
        </div>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2">#</th>
              <th>Month</th>
              <th>Method</th>
              <th>Status</th>
              <th>Numbers</th>
              <th>Pool</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {draws.map(draw => (
              <tr key={draw.id} className="border-t border-white/5">
                <td className="py-3 font-bold">{draw.draw_number}</td>
                <td>{draw.month_year}</td>
                <td className="capitalize">{draw.method}</td>
                <td>
                  <Badge variant={draw.status === 'published' || draw.status === 'completed' ? 'emerald' : 'amber'}>
                    {draw.status}
                  </Badge>
                </td>
                <td>{(draw.winning_numbers || []).join(', ') || '—'}</td>
                <td>{formatCents(draw.total_prize_pool_cents)}</td>
                <td className="text-right space-x-2 whitespace-nowrap">
                  {draw.status !== 'published' && draw.status !== 'completed' && (
                    <>
                      <Button size="sm" variant="outline" isLoading={busyId === draw.id} onClick={() => simulate(draw, 'random')}>
                        Random sim
                      </Button>
                      <Button size="sm" variant="outline" isLoading={busyId === draw.id} onClick={() => simulate(draw, 'algorithmic')}>
                        Weighted sim
                      </Button>
                      <Button size="sm" variant="outline" isLoading={busyId === draw.id} onClick={() => simulateCustom(draw)}>
                        Custom sim
                      </Button>
                      <Button size="sm" onClick={() => publish(draw.id)} disabled={!draw.winning_numbers?.length}>
                        Publish
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {simulation && (
        <Card glow="gold">
          <h2 className="font-bold">Latest simulation review</h2>
          <p className="text-sm text-slate-400 mt-1">
            Draw #{simulation.drawNumber} · {simulation.method} · winning numbers {simulation.winningNumbers?.join(', ')}
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
            <div>Entries: {simulation.totalEntries} / {simulation.totalSubscribers} subscribers</div>
            <div>Pool: {formatCents(simulation.totalPrizePoolCents)}</div>
            <div>Rollover out: {formatCents(simulation.rolloverOutCents)}</div>
            <div>5-match: {simulation.tier5Winners} × {formatCents(simulation.tier5PayoutPerWinnerCents)}</div>
            <div>4-match: {simulation.tier4Winners} × {formatCents(simulation.tier4PayoutPerWinnerCents)}</div>
            <div>3-match: {simulation.tier3Winners} × {formatCents(simulation.tier3PayoutPerWinnerCents)}</div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Winner</th>
                  <th>Tier</th>
                  <th>Matched</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {(simulation.winners || []).map((w: any) => (
                  <tr key={w.userId} className="border-t border-white/5">
                    <td className="py-2">{w.userName}</td>
                    <td>{w.prizeTier}</td>
                    <td>{(w.matchedNumbers || []).join(', ')}</td>
                    <td>{formatCents(w.prizeAmountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Configure monthly draw">
        <div className="space-y-3">
          <Input label="Draw date" type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)} />
          <Input label="Month (YYYY-MM)" value={monthYear} onChange={e => setMonthYear(e.target.value)} />
          <label className="block text-xs uppercase tracking-wider text-slate-400">Method</label>
          <select className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2.5 text-sm" value={method} onChange={e => setMethod(e.target.value as any)}>
            <option value="random">Random lottery</option>
            <option value="algorithmic">Algorithmic (score-frequency weighted)</option>
          </select>
          <Input label="Jackpot rollover in (USD)" type="number" value={rollover} onChange={e => setRollover(e.target.value)} />
          <Button className="w-full" onClick={create}>
            Save draft
          </Button>
        </div>
      </Modal>
    </div>
  );
}
