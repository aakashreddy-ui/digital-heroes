import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { api } from '../../api/client';
import { formatCents } from '../../lib/utils';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.admin.getAnalytics().then(setData).catch(console.error);
  }, []);

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-black">Analytics & reports</h1>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-slate-400">Total users</p>
          <p className="text-2xl font-black">{metrics.totalUsers || 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Active subscribers</p>
          <p className="text-2xl font-black">{metrics.activeSubscribers || 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Prize awarded</p>
          <p className="text-2xl font-black">{formatCents(metrics.totalPrizeAwardedCents)}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Charity total</p>
          <p className="text-2xl font-black">{formatCents(metrics.totalCharityRaisedCents)}</p>
        </Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-bold mb-2">Subscription vs independent charity funds</h2>
          <p className="text-sm text-slate-400">Subscriptions {formatCents(metrics.subscriptionCharityCents)}</p>
          <p className="text-sm text-slate-400">Independent donations {formatCents(metrics.independentDonationCents)}</p>
        </Card>
        <Card>
          <h2 className="font-bold mb-2">Operations</h2>
          <p className="text-sm text-slate-400">Draws {metrics.totalDraws || 0}</p>
          <p className="text-sm text-slate-400">Pending proofs {metrics.pendingProofs || 0}</p>
          <p className="text-sm text-slate-400">Pending payouts {metrics.pendingPayouts || 0}</p>
        </Card>
      </div>
      <Card>
        <h2 className="font-bold mb-4">Score distribution</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.scoreDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="bin" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <h2 className="font-bold mb-4">Charity supporters</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2">Charity</th>
                <th>Supporters</th>
                <th>Independent gifts</th>
              </tr>
            </thead>
            <tbody>
              {(data?.charityBreakdown || []).map((row: any) => (
                <tr key={row.id} className="border-t border-white/5">
                  <td className="py-2">{row.name}</td>
                  <td>{row.supporters_count}</td>
                  <td>{formatCents(row.independent_donations_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
