import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { StablefordScore } from '../../../../shared/types';

export function AdminUsersPage() {
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [scores, setScores] = useState<StablefordScore[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const load = async () => {
    const res = await api.admin.getUsers({ search: search || undefined, role: role || undefined });
    setUsers(res.users || res);
  };

  useEffect(() => {
    load().catch(console.error);
  }, [search, role]);

  const openUser = async (user: any) => {
    setSelected(user);
    setName(user.full_name);
    setPhone(user.phone || '');
    const userScores = await api.admin.getUserScores(user.id);
    setScores(userScores);
  };

  const saveUser = async () => {
    try {
      await api.admin.updateUser(selected.id, { full_name: name, phone });
      success('User updated');
      setSelected(null);
      await load();
    } catch (err: any) {
      error(err.message);
    }
  };

  const saveScore = async (score: StablefordScore, value: string) => {
    try {
      await api.admin.updateScore(score.id, { score: Number(value), score_date: score.score_date });
      success('Score updated');
      setScores(await api.admin.getUserScores(selected.id));
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-black">Users</h1>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search name or email" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="rounded-xl bg-slate-900 border border-white/10 px-3 text-sm" value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="subscriber">Subscriber</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-white/5">
                  <td className="py-2">{user.full_name}</td>
                  <td>{user.email}</td>
                  <td className="capitalize">{user.role}</td>
                  <td className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openUser(user)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Edit user" maxWidth="lg">
        {selected && (
          <div className="space-y-4">
            <Input label="Name" value={name} onChange={e => setName(e.target.value)} />
            <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
            <Button onClick={saveUser}>Save profile</Button>
            <h3 className="font-bold pt-4">Scores</h3>
            {scores.map(score => (
              <div key={score.id} className="flex gap-2 items-end">
                <Input label={score.score_date} defaultValue={String(score.score)} onBlur={e => saveScore(score, e.target.value)} />
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
