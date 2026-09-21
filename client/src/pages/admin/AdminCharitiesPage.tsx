import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../api/client';
import { Charity } from '../../../../shared/types';
import { useToast } from '../../contexts/ToastContext';

const emptyForm = {
  name: '',
  mission: '',
  description: '',
  category: 'Community',
  logo_url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=200&auto=format&fit=crop&q=80',
  hero_image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80',
  website: '',
  is_featured: false,
  upcoming_events: '[]',
  impact_metrics: '[]',
};

export function AdminCharitiesPage() {
  const { success, error } = useToast();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Charity | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => setCharities(await api.charities.getAll());

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const startEdit = (charity: Charity) => {
    setEditing(charity);
    setForm({
      name: charity.name,
      mission: charity.mission,
      description: charity.description,
      category: charity.category,
      logo_url: charity.logo_url,
      hero_image_url: charity.hero_image_url,
      website: charity.website || '',
      is_featured: charity.is_featured,
      upcoming_events: JSON.stringify(charity.upcoming_events || [], null, 2),
      impact_metrics: JSON.stringify(charity.impact_metrics || [], null, 2),
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = {
        ...form,
        is_featured: form.is_featured,
        is_active: true,
        upcoming_events: JSON.parse(form.upcoming_events || '[]'),
        impact_metrics: JSON.parse(form.impact_metrics || '[]'),
      };
      if (editing) {
        await api.charities.update(editing.id, payload);
        success('Charity updated');
      } else {
        await api.charities.create(payload);
        success('Charity created');
      }
      setOpen(false);
      await load();
    } catch (err: any) {
      error(err.message || 'Invalid events/metrics JSON');
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm('Deactivate this charity? Existing subscriber selections remain until they change.')) return;
    try {
      await api.charities.delete(id);
      success('Charity deactivated');
      await load();
    } catch (err: any) {
      error(err.message);
    }
  };

  const toggleFeatured = async (charity: Charity) => {
    try {
      await api.charities.update(charity.id, { is_featured: !charity.is_featured });
      await load();
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-black">Charity management</h1>
        <Button onClick={startCreate}>Add charity</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {charities.map(charity => (
          <Card key={charity.id}>
            <div className="flex gap-3">
              <img src={charity.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex gap-2 items-center">
                  <h2 className="font-bold truncate">{charity.name}</h2>
                  {charity.is_featured && <Badge variant="gold">Featured</Badge>}
                  {!charity.is_active && <Badge variant="rose">Inactive</Badge>}
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{charity.mission}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => startEdit(charity)}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => toggleFeatured(charity)}>
                {charity.is_featured ? 'Unfeature' : 'Feature'}
              </Button>
              <Button size="sm" variant="danger" onClick={() => deactivate(charity.id)}>
                Deactivate
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Edit charity' : 'Add charity'} maxWidth="lg">
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <Input label="Mission" value={form.mission} onChange={e => setForm({ ...form, mission: e.target.value })} />
          <label className="block text-xs uppercase tracking-wider text-slate-400">Description</label>
          <textarea
            className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-sm"
            rows={3}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <Input label="Logo URL" value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} />
          <Input label="Hero image URL" value={form.hero_image_url} onChange={e => setForm({ ...form, hero_image_url: e.target.value })} />
          <Input label="Website" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
            Featured on homepage
          </label>
          <label className="block text-xs uppercase tracking-wider text-slate-400">Upcoming events JSON</label>
          <textarea
            className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-xs font-mono"
            rows={4}
            value={form.upcoming_events}
            onChange={e => setForm({ ...form, upcoming_events: e.target.value })}
          />
          <label className="block text-xs uppercase tracking-wider text-slate-400">Impact metrics JSON</label>
          <textarea
            className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-xs font-mono"
            rows={3}
            value={form.impact_metrics}
            onChange={e => setForm({ ...form, impact_metrics: e.target.value })}
          />
          <Button className="w-full" onClick={save}>
            Save charity
          </Button>
        </div>
      </Modal>
    </div>
  );
}
