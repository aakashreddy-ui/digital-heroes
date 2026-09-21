import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

export function SignupPage() {
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signup({ email, password, full_name: fullName, phone });
      navigate('/pricing');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-hero-bg text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md" glow="gold">
          <h1 className="text-2xl font-display font-black text-white">Become a Digital Hero</h1>
          <p className="text-sm text-slate-400 mt-1">Create your account, then choose a plan and a charity.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Input label="Full name" value={fullName} onChange={e => setFullName(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create account
            </Button>
          </form>
          <p className="mt-6 text-sm text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="text-emerald-400 hover:underline">
              Log in
            </Link>
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
