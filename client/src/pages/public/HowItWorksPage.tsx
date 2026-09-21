import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Heart, Trophy, CreditCard, Sparkles, Gift, Shield } from 'lucide-react';

const steps = [
  { title: 'Subscribe', copy: 'Choose monthly or yearly membership. A minimum of 10% funds your charity.', icon: CreditCard },
  { title: 'Play', copy: 'Keep competing in your usual game. Digital Heroes never replaces your handicap platform.', icon: Sparkles },
  { title: 'Enter scores', copy: 'Log Stableford totals from 1–45. Only your latest five scores are kept.', icon: Trophy },
  { title: 'Draw', copy: 'Each month, five numbers are drawn at random or with weighted frequency logic.', icon: Shield },
  { title: 'Win', copy: 'Match 5, 4, or 3 numbers to share that tier’s prize pool after verification.', icon: Gift },
  { title: 'Give back', copy: 'Every active membership continuously funds verified charitable partners.', icon: Heart },
];

export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-hero-bg text-slate-100 flex flex-col">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-16 flex-1">
        <h1 className="text-4xl font-display font-black">How Digital Heroes works</h1>
        <p className="mt-3 text-slate-400 max-w-2xl">
          The platform is charity-first. Golf scores are simply the participation mechanic that makes monthly prize draws fair, auditable, and engaging.
        </p>
        <div className="mt-10 grid md:grid-cols-2 gap-4">
          {steps.map((step, index) => (
            <Card key={step.title} hover>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <step.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Step {index + 1}</p>
                  <h2 className="font-bold">{step.title}</h2>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-400">{step.copy}</p>
            </Card>
          ))}
        </div>
        <div className="mt-10">
          <Link to="/pricing">
            <Button size="lg">Start a membership</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
