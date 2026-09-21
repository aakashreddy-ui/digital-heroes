import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { api } from '../../api/client';
import { formatCents } from '../../lib/utils';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function AdminHomePage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.admin.getAnalytics().then(setData).catch(console.error);
  }, []);

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-black">Admin overview</h1>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-slate-400">Users</p>
          <p className="text-2xl font-black">{metrics.totalUsers || 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Active subscribers</p>
          <p className="text-2xl font-black">{metrics.activeSubscribers || 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Charity total</p>
          <p className="text-2xl font-black">{formatCents(metrics.totalCharityRaisedCents)}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Pending proofs</p>
          <p className="text-2xl font-black">{metrics.pendingProofs || 0}</p>
        </Card>
      </div>
      <Card>
        <h2 className="font-bold mb-4">Score distribution</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.scoreDistribution || []}>
              <XAxis dataKey="bin" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
