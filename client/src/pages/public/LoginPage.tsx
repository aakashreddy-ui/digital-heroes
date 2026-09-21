import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const { login, loginAsDemo, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-hero-bg text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md" glow="emerald">
          <h1 className="text-2xl font-display font-black text-white">Welcome back</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to track scores, draws, and charitable impact.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Log in
            </Button>
          </form>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => loginAsDemo('subscriber').then(() => navigate('/dashboard'))}>
              Demo subscriber
            </Button>
            <Button variant="outline" size="sm" onClick={() => loginAsDemo('admin').then(() => navigate('/admin'))}>
              Demo admin
            </Button>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            New here?{' '}
            <Link to="/signup" className="text-emerald-400 hover:underline">
              Create an account
            </Link>
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
