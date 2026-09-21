import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Navbar } from './Navbar';
import { Badge } from '../ui/Badge';
import {
  LayoutDashboard,
  Trophy,
  Ticket,
  Award,
  Heart,
  CreditCard,
  User,
  Settings,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export function DashboardLayout() {
  const { user, isSubscriber } = useAuth();
  const location = useLocation();

  const sidebarLinks = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Stableford Scores', path: '/dashboard/scores', icon: Trophy },
    { label: 'Draw Participation', path: '/dashboard/draws', icon: Ticket },
    { label: 'Winnings & Proof', path: '/dashboard/winnings', icon: Award },
    { label: 'My Charity', path: '/dashboard/charity', icon: Heart },
    { label: 'Subscription', path: '/dashboard/subscription', icon: CreditCard },
    { label: 'Profile', path: '/dashboard/profile', icon: User },
    { label: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-hero-bg text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          {/* User card */}
          <div className="glass-panel rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                alt={user?.full_name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500/40 shadow-glow-emerald"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-400">Membership</span>
              {isSubscriber ? (
                <Badge variant="emerald" size="sm">
                  <ShieldCheck className="w-3 h-3" />
                  Active Hero
                </Badge>
              ) : (
                <Badge variant="rose" size="sm">
                  Inactive
                </Badge>
              )}
            </div>

            {user?.selected_charity?.charity && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Supporting</p>
                <p className="text-xs font-medium text-emerald-300 truncate mt-0.5">
                  {user.selected_charity.charity.name} ({user.selected_charity.contribution_percentage}%)
                </p>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="glass-panel rounded-2xl p-2 border border-white/10 space-y-1">
            {sidebarLinks.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-emerald-400" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
