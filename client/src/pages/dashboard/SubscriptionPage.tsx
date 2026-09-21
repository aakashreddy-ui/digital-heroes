import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';
import { Subscription } from '../../../../shared/types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCents, formatDate } from '../../lib/utils';

export function SubscriptionPage() {
  const { refreshProfile } = useAuth();
  const { success, error } = useToast();
  const [params] = useSearchParams();
  const [sub, setSub] = useState<Subscription | null>(null);

  const load = async () => {
    const current = await api.subscription.getCurrent();
    setSub(current);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useEffect(() => {
    const status = params.get('status');
    const plan = params.get('plan') as 'monthly' | 'yearly' | null;
    if (status === 'success' && params.get('simulated') === 'true') {
      api.subscription
        .activateTest(plan || 'monthly')
        .then(async () => {
          await refreshProfile();
          await load();
          success('Subscription activated');
        })
        .catch((err: any) => error(err.message));
    } else if (status === 'success') {
      success('Payment received. Your subscription will activate when Stripe confirms it.');
      load().catch(() => undefined);
    }
  }, [params, refreshProfile, success, error]);

  const cancel = async (immediate: boolean) => {
    try {
      await api.subscription.cancel(immediate);
      await refreshProfile();
      await load();
      success(immediate ? 'Subscription cancelled' : 'Will cancel at period end');
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-black">Subscription</h1>
      <Card>
        {sub ? (
          <div className="space-y-3">
            <Badge variant={sub.status === 'active' ? 'emerald' : 'rose'}>{sub.status}</Badge>
            <p className="text-lg font-bold capitalize">{sub.plan_id} plan</p>
            <p className="text-sm text-slate-400">Renews / ends {formatDate(sub.current_period_end)}</p>
            <p className="text-sm text-slate-500">Period started {formatDate(sub.current_period_start)}</p>
            {sub.status === 'active' && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" onClick={() => cancel(false)}>
                  Cancel at period end
                </Button>
                <Button variant="danger" onClick={() => cancel(true)}>
                  Cancel immediately
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-slate-400">No subscription on file.</p>
            <Button className="mt-4" onClick={() => (window.location.href = '/pricing')}>
              Choose a plan
            </Button>
          </div>
        )}
      </Card>
      <Card>
        <p className="text-sm text-slate-400">
          Monthly {formatCents(2500)} · Yearly {formatCents(25000)}. Stripe webhooks keep status in sync when keys are configured.
        </p>
      </Card>
    </div>
  );
}
