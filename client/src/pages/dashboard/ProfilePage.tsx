import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

export function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { success, error } = useToast();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar_url || '');

  const save = async () => {
    try {
      await api.auth.updateProfile({ full_name: fullName, phone, avatar_url: avatar });
      await refreshProfile();
      success('Profile updated');
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-black">Profile</h1>
      <Card className="max-w-xl space-y-4">
        <Input label="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
        <Input label="Email" value={user?.email || ''} disabled />
        <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
        <Input label="Avatar URL" value={avatar} onChange={e => setAvatar(e.target.value)} />
        <Button onClick={save}>Save profile</Button>
      </Card>
    </div>
  );
}
