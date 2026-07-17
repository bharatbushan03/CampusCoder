'use client';

import React, { useState } from 'react';
import { 
  Search,
  BookOpen,
  ExternalLink,
  Code,
  Briefcase,
  Sparkles,
  Map,
  Database as DatabaseIcon,
  Video,
  Award,
  TerminalSquare,
  Users,
  Server
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedSection, AnimatedCard } from '@/components/animations/ScrollAnimations';
import { resourcesData, ResourceCategory } from '@/data/resourcesData';

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | 'all'>('all');

  const categories: { id: ResourceCategory | 'all', label: string, icon: any }[] = [
    { id: 'all', label: 'All', icon: BookOpen },
    { id: 'free-tools', label: 'Free Tools', icon: TerminalSquare },
    { id: 'courses', label: 'Courses', icon: Video },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'dsa', label: 'DSA & Practice', icon: DatabaseIcon },
    { id: 'roadmaps', label: 'Roadmaps', icon: Map },
    { id: 'interview-prep', label: 'Interviews', icon: Briefcase },
    { id: 'open-source', label: 'Open Source', icon: Users },
    { id: 'hackathons', label: 'Hackathons', icon: Code },
    { id: 'system-design', label: 'System Design', icon: Server },
  ];

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    if (cat && cat.icon) {
      const Icon = cat.icon;
      return <Icon className="h-5 w-5 text-emerald-400" />;
    }
    return <BookOpen className="h-5 w-5 text-emerald-400" />;
  };

  const filteredResources = resourcesData.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' ? true : res.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <AnimatedSection className="space-y-4 text-center max-w-3xl mx-auto" direction="up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest">
          <Sparkles className="h-3 w-3" /> Learning hub
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-mono">
          <span className="text-emerald-500">Resources</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Curated guides, tools, practice platforms, and courses for developers.
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
            <span className="hidden sm:inline">{cat.label}</span>
          </button>
        ))}
      </AnimatedSection>

      {/* Search */}
      <AnimatedSection className="relative max-w-xl mx-auto" direction="none" delay={0.15}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search tools, courses, tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors shadow-2xl"
        />
      </AnimatedSection>

      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res, index) => (
            <AnimatedCard key={res.id} className="flex flex-col h-full" delay={index * 0.05}>
              <Card className="group flex flex-col h-full border-slate-800 bg-slate-950/40 hover:border-emerald-500/20 transition-all p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    {getCategoryIcon(res.category)}
                  </div>
                  <div className="flex gap-2">
                    {res.isFree && (
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Free
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter border border-slate-800 px-2 py-0.5 rounded-full">
                      {res.category.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {res.description}
                  </p>
                  
                  {res.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {res.tags.map(tag => (
                        <span key={tag} className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                  <a 
                    href={res.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors group/link"
                  >
                    Visit resource
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
          <p className="text-slate-500 font-mono text-sm">No resources match your search.</p>
          <Button variant="outline" size="sm" onClick={() => {setActiveCategory('all'); setSearchQuery('');}}>
            Clear Filters
          </Button>
        </div>
      )}
      
      {/* Community Call to Action */}
      <div className="pt-12 text-center">
        <p className="text-xs text-slate-500 font-mono">Know a good resource? Share it on Discord.</p>
      </div>
    </div>
  );
}
