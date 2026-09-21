import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, ErrorState, LoadingBlock } from '../../components/ui/EmptyState';
import { api } from '../../api/client';
import { StablefordScore } from '../../../../shared/types';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../lib/utils';
import { Trophy } from 'lucide-react';

export function ScoresPage() {
  const { success, error } = useToast();
  const [scores, setScores] = useState<StablefordScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StablefordScore | null>(null);
  const [score, setScore] = useState('36');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [course, setCourse] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setScores(await api.scores.getAll());
      setErr('');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setScore('36');
    setDate(new Date().toISOString().slice(0, 10));
    setCourse('');
    setNotes('');
    setOpen(true);
  };

  const openEdit = (item: StablefordScore) => {
    setEditing(item);
    setScore(String(item.score));
    setDate(item.score_date.slice(0, 10));
    setCourse(item.course_name || '');
    setNotes(item.notes || '');
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = {
        score: Number(score),
        score_date: date,
        course_name: course,
        notes,
      };
      if (editing) {
        await api.scores.update(editing.id, payload);
        success('Score updated');
      } else {
        await api.scores.add(payload);
        success('Score saved. Only the latest 5 dates are retained.');
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      error(e.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this score?')) return;
    try {
      await api.scores.delete(id);
      success('Score deleted');
      await load();
    } catch (e: any) {
      error(e.message);
    }
  };

  if (loading) return <LoadingBlock />;
  if (err) return <ErrorState message={err} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-black">Stableford scores</h1>
          <p className="text-sm text-slate-400">Range 1–45. One score per date. Newest five only.</p>
        </div>
        <Button onClick={openCreate}>Add score</Button>
      </div>
      {scores.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-10 h-10" />}
          title="No scores yet"
          description="Add your first Stableford total to start building your monthly draw entry."
          action={<Button onClick={openCreate}>Add a score</Button>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-3">Date</th>
                <th>Score</th>
                <th>Course</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {scores.map(item => (
                <tr key={item.id} className="border-t border-white/5">
                  <td className="py-3">{formatDate(item.score_date)}</td>
                  <td className="font-bold text-emerald-400">{item.score}</td>
                  <td>{item.course_name || '—'}</td>
                  <td className="text-slate-400">{item.notes || '—'}</td>
                  <td className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => remove(item.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Card>
        <p className="text-xs text-slate-400">
          Adding a sixth score automatically removes the oldest stored date on the server. Duplicate dates are rejected.
        </p>
      </Card>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Edit score' : 'Add score'}>
        <div className="space-y-3">
          <Input label="Stableford score (1-45)" type="number" min={1} max={45} value={score} onChange={e => setScore(e.target.value)} />
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Input label="Course (optional)" value={course} onChange={e => setCourse(e.target.value)} />
          <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
          <Button className="w-full" onClick={save}>
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}
