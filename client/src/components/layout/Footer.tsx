import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Heart, Trophy, ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070A0F] pt-16 pb-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/5">
          {/* Col 1: Brand & Emotion-driven mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center shadow-glow-emerald border border-emerald-300/30">
                <Shield className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="font-display font-black text-xl text-white tracking-tight">
                DIGITAL<span className="text-emerald-400">HEROES</span>
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed max-w-md">
              Digital Heroes turns everyday golf performance into direct philanthropic power. By tracking Stableford scores, members compete for monthly cash jackpots while funding verified non-profit organizations creating life-changing impact worldwide.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Heart className="w-3.5 h-3.5 fill-emerald-400/20 text-emerald-400" />
                100% Verified Charities
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Auditable Monthly Draws
              </span>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/charities" className="hover:text-emerald-400 transition-colors">
                  Charity Directory
                </Link>
              </li>
              <li>
                <Link to="/draw" className="hover:text-emerald-400 transition-colors">
                  Draw Mechanics & Odds
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-emerald-400 transition-colors">
                  Subscription Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Account & Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Community</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Subscriber Portal
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-emerald-400 transition-colors">
                  Join as a Patron
                </Link>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed flex items-center gap-1">
                  Charity Partner Program <ArrowUpRight className="w-3 h-3" />
                </span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Draw Audit Reports
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Digital Heroes Foundation. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Responsible Gaming</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
