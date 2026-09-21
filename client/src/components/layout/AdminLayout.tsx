import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Badge } from '../ui/Badge';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Ticket,
  Heart,
  CheckCircle2,
  BarChart3,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

export function AdminLayout() {
  const location = useLocation();

  const adminLinks = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'User Management', path: '/admin/users', icon: Users },
    { label: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
    { label: 'Draws & Simulation', path: '/admin/draws', icon: Ticket },
    { label: 'Charity Management', path: '/admin/charities', icon: Heart },
    { label: 'Winner Verification', path: '/admin/winners', icon: CheckCircle2 },
    { label: 'Analytics & Reports', path: '/admin/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col md:flex-row gap-8">
        {/* Admin Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="glass-panel rounded-2xl p-4 border border-purple-500/20 bg-purple-950/10">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">ADMIN CONSOLE</h3>
            </div>
            <p className="text-xs text-slate-400">
              Platform administration, draw simulation, winner audits, and charity management.
            </p>
            <Badge variant="gold" size="sm" className="mt-3">
              Super Admin Access
            </Badge>
          </div>

          <nav className="glass-panel rounded-2xl p-2 border border-white/10 space-y-1">
            {adminLinks.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-purple-400" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
