import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';
import { formatDate } from '../../lib/utils';

export function AdminSubscriptionsPage() {
  const [status, setStatus] = useState('');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.admin.getSubscriptions({ status: status || undefined }).then(setItems).catch(() => setItems([]));
  }, [status]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-black">Subscriptions</h1>
      <select className="rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="">All statuses</option>
        {['active', 'past_due', 'cancelled', 'incomplete', 'inactive'].map(s => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2">User</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Renewal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-t border-white/5">
                  <td className="py-2">{item.user_name || item.user_id}</td>
                  <td className="capitalize">{item.plan_id}</td>
                  <td>
                    <Badge variant={item.status === 'active' ? 'emerald' : 'rose'}>{item.status}</Badge>
                  </td>
                  <td>{formatDate(item.current_period_end)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
