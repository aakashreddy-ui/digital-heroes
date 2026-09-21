import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';
import { Charity } from '../../../../shared/types';
import { Search, Heart, ArrowRight, Globe, Sparkles } from 'lucide-react';

export function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const categories = [
    'All',
    'Youth & Education',
    'Veterans & Health',
    'Environment',
    'Accessibility',
    'Global Aid',
    'Community',
  ];

  useEffect(() => {
    setLoading(true);
    api.charities
      .getAll({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery || undefined,
      })
      .then(setCharities)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-hero-bg text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="emerald" size="md" className="mb-3">
            Charity Directory
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-display font-black text-white tracking-tight">
            Discover Verified Causes
          </h1>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Explore the organizations turning Digital Heroes subscription funds and community donations into tangible humanitarian and environmental impact.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 mb-10 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search charities by name, mission, or cause..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald font-bold'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Charity Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-panel h-80 rounded-2xl animate-pulse bg-white/5" />
            ))}
          </div>
        ) : charities.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-3xl border border-white/10">
            <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No charities found</h3>
            <p className="text-xs text-slate-400 mt-1">Try refining your search term or selecting another category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {charities.map(charity => (
              <Card key={charity.id} hover className="flex flex-col justify-between overflow-hidden group">
                <div>
                  <div className="relative h-48 -mx-6 -mt-6 mb-5 overflow-hidden">
                    <img
                      src={charity.hero_image_url}
                      alt={charity.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge variant="emerald">{charity.category}</Badge>
                      {charity.is_featured && (
                        <Badge variant="gold">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{charity.name}</h3>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">{charity.description}</p>

                  {charity.impact_metrics && charity.impact_metrics.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 mb-4">
                      {charity.impact_metrics.slice(0, 2).map((m, idx) => (
                        <div key={idx} className="bg-white/5 p-2 rounded-xl text-center">
                          <p className="text-xs font-bold text-emerald-400">{m.value}</p>
                          <p className="text-[10px] text-slate-400 truncate">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-2">
                  <Link to={`/charities/${charity.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View Profile
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                  {charity.website && (
                    <a
                      href={charity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
