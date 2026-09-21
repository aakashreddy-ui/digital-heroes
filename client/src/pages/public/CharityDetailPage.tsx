import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../api/client';
import { Charity } from '../../../../shared/types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCents, formatDate } from '../../lib/utils';
import { Calendar, Heart } from 'lucide-react';
import { LoadingBlock, ErrorState } from '../../components/ui/EmptyState';

export function CharityDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user, refreshProfile } = useAuth();
  const { success, error } = useToast();
  const [charity, setCharity] = useState<Charity | null>(null);
  const [loadError, setLoadError] = useState('');
  const [donateOpen, setDonateOpen] = useState(false);
  const [amount, setAmount] = useState('50');
  const [donorName, setDonorName] = useState(user?.full_name || '');

  useEffect(() => {
    if (!id) return;
    api.charities
      .getById(id)
      .then(setCharity)
      .catch(err => setLoadError(err.message));
  }, [id]);

  if (loadError) {
    return (
      <div className="min-h-screen bg-hero-bg">
        <Navbar />
        <div className="max-w-3xl mx-auto p-8">
          <ErrorState message={loadError} />
        </div>
      </div>
    );
  }

  if (!charity) {
    return (
      <div className="min-h-screen bg-hero-bg">
        <Navbar />
        <LoadingBlock />
      </div>
    );
  }

  const donate = async () => {
    try {
      const checkout = await api.donations.create({
        charity_id: charity.id,
        amount_cents: Math.round(Number(amount) * 100),
        frequency: 'one_off',
        donor_name: donorName,
        donor_email: user?.email,
      });
      if (checkout.checkoutUrl && !checkout.simulated) {
        window.location.href = checkout.checkoutUrl;
        return;
      }
      success('Independent donation recorded. Thank you.');
      setDonateOpen(false);
    } catch (err: any) {
      error(err.message);
    }
  };

  const selectCharity = async () => {
    if (!isAuthenticated) return;
    try {
      await api.charities.setUserSelection({ charity_id: charity.id, contribution_percentage: 10 });
      await refreshProfile();
      success(`You are now supporting ${charity.name}`);
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-hero-bg text-slate-100 flex flex-col">
      <Navbar />
      <div className="relative h-72 md:h-96">
        <img src={charity.hero_image_url} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-hero-bg via-hero-bg/40 to-transparent" />
      </div>
      <main className="max-w-5xl mx-auto px-4 -mt-24 relative z-10 pb-16 flex-1">
        <Card>
          <div className="flex flex-col md:flex-row gap-6">
            <img src={charity.logo_url} alt="" className="w-20 h-20 rounded-2xl object-cover" />
            <div className="flex-1">
              <Badge>{charity.category}</Badge>
              <h1 className="mt-2 text-3xl font-display font-black">{charity.name}</h1>
              <p className="mt-2 text-slate-300">{charity.mission}</p>
            </div>
          </div>
          <p className="mt-6 text-slate-400 leading-relaxed">{charity.description}</p>
          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            {charity.impact_metrics?.map(metric => (
              <div key={metric.label} className="rounded-xl bg-white/5 p-4">
                <p className="text-lg font-bold text-emerald-400">{metric.value}</p>
                <p className="text-xs text-slate-400">{metric.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {isAuthenticated && (
              <Button onClick={selectCharity}>
                <Heart className="w-4 h-4 mr-2" />
                Select as my charity
              </Button>
            )}
            <Button variant="outline" onClick={() => setDonateOpen(true)}>
              Independent donation
            </Button>
            <Link to="/pricing">
              <Button variant="gold">Subscribe to fund this cause</Button>
            </Link>
          </div>
        </Card>

        <h2 className="mt-10 text-xl font-bold">Upcoming events</h2>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {(charity.upcoming_events || []).map(event => (
            <Card key={event.id}>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Calendar className="w-4 h-4" />
                {formatDate(event.date)}
              </div>
              <h3 className="mt-2 font-bold">{event.title}</h3>
              <p className="text-sm text-slate-400">{event.location}</p>
              <p className="mt-2 text-sm text-slate-300">{event.description}</p>
            </Card>
          ))}
        </div>
      </main>
      <Footer />

      <Modal isOpen={donateOpen} onClose={() => setDonateOpen(false)} title="Independent donation">
        <p className="text-sm text-slate-400 mb-4">
          This gift is not tied to gameplay or prize draws. Amount: {formatCents(Math.round(Number(amount || 0) * 100))}.
        </p>
        <div className="space-y-3">
          <Input label="Your name" value={donorName} onChange={e => setDonorName(e.target.value)} />
          <Input label="Amount (USD)" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} />
          <Button className="w-full" onClick={donate}>
            Confirm donation
          </Button>
        </div>
      </Modal>
    </div>
  );
}
