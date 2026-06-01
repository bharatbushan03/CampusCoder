'use client';

import React, { useState, useEffect } from 'react';
import { 
  Loader2,
  Search,
  BookOpen,
  ExternalLink,
  Code,
  Briefcase,
  Sparkles,
  Map,
  Database
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';
import { AnimatedSection, AnimatedCard } from '@/components/animations/ScrollAnimations';

type ResourceRow = Database['public']['Tables']['resources']['Row'];

export default function ResourcesPage() {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Resources', icon: BookOpen },
    { id: 'roadmaps', label: 'Roadmaps', icon: Map },
    { id: 'practice', label: 'Practice', icon: Code },
    { id: 'dsa', label: 'DSA Kits', icon: Database },
    { id: 'placement', label: 'Placements', icon: Briefcase },
  ];

  useEffect(() => {
    const loadResources = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .returns<ResourceRow[]>();

        if (error) throw error;
        setResources(data || []);
      } catch (err) {
        console.warn('Failed to load resources:', err);
      } finally {
        setLoading(false);
      }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadResources();
  }, []);

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' ? true : res.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-screen">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <AnimatedSection className="space-y-4 text-center max-w-3xl mx-auto" direction="up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest">
          <Sparkles className="h-3 w-3" /> Learning Repository
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-mono">
          Knowledge <span className="text-emerald-500">Hub</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          A curated collection of roadmaps, practice platforms, and placement prep kits designed to take you from a curious beginner to a professional developer.
        </p>
      </AnimatedSection>

      {/* Category Tabs */}
      <AnimatedSection className="flex flex-wrap justify-center gap-2" direction="none" delay={0.1}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all border ${
              activeCategory === cat.id 
                ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400'
            }`}
          >
            <cat.icon className="h-3.5 w-3.5" />
            {cat.label}
          </button>
        ))}
      </AnimatedSection>

      {/* Search */}
      <AnimatedSection className="relative max-w-xl mx-auto" direction="none" delay={0.15}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search topics (e.g. React, Python, Mock Interviews)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors shadow-2xl"
        />
      </AnimatedSection>

      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res, index) => (
            <AnimatedCard key={res.id} className="flex flex-col h-full" delay={index * 0.08}>
              <Card className="group flex flex-col h-full border-slate-800 bg-slate-950/40 hover:border-emerald-500/20 transition-all p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    {res.category === 'roadmaps' && <Map className="h-5 w-5 text-emerald-400" />}
                    {res.category === 'practice' && <Code className="h-5 w-5 text-emerald-400" />}
                    {res.category === 'dsa' && <Database className="h-5 w-5 text-emerald-400" />}
                    {res.category === 'placement' && <Briefcase className="h-5 w-5 text-emerald-400" />}
                    {(!['roadmaps', 'practice', 'dsa', 'placement'].includes(res.category)) && <BookOpen className="h-5 w-5 text-emerald-400" />}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter border border-slate-900 px-2 py-0.5 rounded-full">
                    {res.category}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {res.description || "No description provided for this resource."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                  <a 
                    href={res.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors group/link"
                  >
                    Access Resource
                    <ExternalLink className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </Card>
            </AnimatedCard>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-slate-900/10 border border-slate-800 rounded-3xl space-y-4">
          <BookOpen className="h-10 w-10 text-slate-800 mx-auto" />
          <p className="text-slate-500 font-mono text-sm">No resources found matching your current view.</p>
          <Button variant="outline" size="sm" onClick={() => {setActiveCategory('all'); setSearchQuery('');}}>
            Clear Filters
          </Button>
        </div>
      )}
      
      {/* Community Call to Action */}
      <div className="pt-12 text-center">
        <p className="text-xs text-slate-500 font-mono">Found a great resource? Share it with the community on our Discord server.</p>
      </div>
    </div>
  );
}
