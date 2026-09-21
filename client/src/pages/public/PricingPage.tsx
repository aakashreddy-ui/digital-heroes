import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';
import { SubscriptionPlan } from '../../../../shared/types';
import { useAuth } from '../../contexts/AuthContext';
import { formatCents } from '../../lib/utils';
import { CheckCircle2 } from 'lucide-react';

export function PricingPage() {
  const { isAuthenticated, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    api.subscription.getPlans().then(setPlans).catch(console.error);
  }, []);

  const choosePlan = async (planId: string) => {
    if (!isAuthenticated) {
      navigate('/signup');
      return;
    }
    setLoading(planId);
    try {
      const session = await api.subscription.createCheckout(planId);
      if (session.simulated) {
        await api.subscription.activateTest(planId);
        await refreshProfile();
        navigate('/dashboard/charity');
      } else if (session.checkoutUrl) {
        window.location.href = session.checkoutUrl;
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-hero-bg text-slate-100 flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-16 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="gold">Membership</Badge>
          <h1 className="mt-3 text-4xl font-display font-black">Fund impact. Enter every monthly draw.</h1>
          <p className="mt-3 text-slate-400">
            A minimum of 10% of every subscription goes to your chosen charity. The remainder powers verified prize pools.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map(plan => (
            <Card key={plan.id} glow={plan.id === 'yearly' ? 'gold' : 'emerald'} className="flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{plan.name}</h2>
                {plan.id === 'yearly' && <Badge variant="gold">Save $50</Badge>}
              </div>
              <p className="mt-4 text-4xl font-black">
                {formatCents(plan.price_cents)}
                <span className="text-sm text-slate-400 font-medium"> / {plan.billing_interval}</span>
              </p>
              <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
              <ul className="mt-6 space-y-2 flex-1">
                {plan.features.map(feature => (
                  <li key={feature} className="flex gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" isLoading={loading === plan.id} onClick={() => choosePlan(plan.id)}>
                Subscribe {plan.name}
              </Button>
            </Card>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500 mt-8">
          Stripe test mode is used in production configuration. Without Stripe keys, checkout activates instantly for local demos.
        </p>
        <p className="text-center mt-4">
          <Link to="/charities" className="text-emerald-400 text-sm">
            Prefer to donate independently? Visit the charity directory.
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
