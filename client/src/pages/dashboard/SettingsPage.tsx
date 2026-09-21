import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-black">Settings</h1>
      <Card>
        <p className="text-sm text-slate-400">Signed in as {user?.email}. Sessions persist locally for 7 days via JWT.</p>
        <Button
          className="mt-4"
          variant="danger"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          Log out
        </Button>
      </Card>
      <Card>
        <h2 className="font-bold">Notifications</h2>
        <p className="text-sm text-slate-400 mt-2">
          Draw results, verification updates, and payout notices are stored with your account and shown in winnings and dashboard cards.
        </p>
      </Card>
    </div>
  );
}
