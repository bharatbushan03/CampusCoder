'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search,
  ExternalLink,
  ArrowRight,
  Settings,
  PlusCircle,
  Loader2,
  X
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedSection, AnimatedCard } from '@/components/animations/ScrollAnimations';
import { Resource, ResourceCategory } from '@/data/resourcesData';
import { CompetitionsSection } from '@/components/resources/CompetitionsSection';
import { NotesSection } from '@/components/resources/NotesSection';
import { YearLevel } from '@/data/notesData';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type BackendResource = {
  id: string;
  title: string;
  description: string | null;
  link: string;
  category: string;
  event_id: string | null;
  is_active: boolean;
  created_at: string;
  events?: { title: string } | null;
};

const CATEGORIES: { id: ResourceCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Library' },
  { id: 'dsa', label: 'DSA & Algorithms' },
  { id: 'system-design', label: 'System Design' },
  { id: 'courses', label: 'Courses & CS' },
  { id: 'roadmaps', label: 'Roadmaps' },
  { id: 'interview-prep', label: 'Interview Prep' },
  { id: 'free-tools', label: 'Developer Tools' },
  { id: 'open-source', label: 'Open Source' },
  { id: 'competitions', label: 'Competitions' },
  { id: 'notes', label: 'Semester Notes' },
];

function ResourcesPageContent() {
  const { profile } = useAuth();
  const isAdminOrOrganizer = profile && (profile.role === 'admin' || profile.role === 'organizer');

  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get('category');
  const initialYearParam = searchParams.get('year') as YearLevel | null;

  const [activeTab, setActiveTab] = useState<'all' | 'competitions' | 'notes'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | 'all'>('all');
  const [notesYear, setNotesYear] = useState<YearLevel>(initialYearParam || '1st-year');

  const [dynamicResources, setDynamicResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic resources from backend API
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await api<{ ok: boolean; resources: BackendResource[] }>('/resources');
        if (data && data.ok && Array.isArray(data.resources) && data.resources.length > 0) {
          const mapped: Resource[] = data.resources.map(r => ({
            id: r.id,
            title: r.title,
            description: r.description || '',
            url: r.link,
            category: r.category as ResourceCategory,
            isFree: true,
            tags: [r.category.replace('-', ' ')],
          }));

          setDynamicResources(mapped);
        } else {
          setDynamicResources([]);
        }
      } catch (err) {
        console.warn('Dynamic resources fetch failed, using curated defaults:', err);
        setDynamicResources([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchResources();
  }, []);

  // Handle URL query parameters on load
  useEffect(() => {
    if (initialCategoryParam === 'competitions') {
      setActiveTab('competitions');
      setActiveCategory('competitions');
    } else if (initialCategoryParam === 'notes') {
      setActiveTab('notes');
      setActiveCategory('notes');
      if (initialYearParam === '1st-year' || initialYearParam === '2nd-year') {
        setNotesYear(initialYearParam);
      }
    } else if (initialCategoryParam) {
      setActiveCategory(initialCategoryParam as ResourceCategory);
      setActiveTab('all');
    }
  }, [initialCategoryParam, initialYearParam]);

  // Dynamic resource pool loaded directly from backend API
  const allResources = dynamicResources;


  const handleCategoryClick = (catId: ResourceCategory | 'all') => {
    setActiveCategory(catId);
    if (catId === 'competitions') {
      setActiveTab('competitions');
    } else if (catId === 'notes') {
      setActiveTab('notes');
    } else {
      setActiveTab('all');
    }
  };

  const filteredResources = useMemo(() => {
    return allResources.filter(res => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        res.title.toLowerCase().includes(q) || 
        res.description.toLowerCase().includes(q) ||
        res.tags.some(tag => tag.toLowerCase().includes(q));

      const matchesCategory = activeCategory === 'all' ? true : res.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allResources, searchQuery, activeCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header & Meta */}
      <AnimatedSection className="space-y-3" direction="up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Developer Resources
            </h1>
          </div>

          {isAdminOrOrganizer && (
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/admin/resources">
                <Button variant="outline" size="sm" className="font-mono text-xs">
                  <Settings className="size-3.5" /> Manage
                </Button>
              </Link>
              <Link href="/admin/resources/new">
                <Button variant="primary" size="sm" className="font-mono text-xs">
                  <PlusCircle className="size-3.5" /> Add Entry
                </Button>
              </Link>
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* Main View Mode Selector (Tabs) */}
      <AnimatedSection direction="none" delay={0.05}>
        <div className="flex flex-wrap items-center gap-2 p-1 bg-[#0e1422] border border-white/[0.08] rounded-xl w-fit">
          <button
            onClick={() => {
              setActiveTab('all');
              setActiveCategory('all');
            }}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Curated Library
          </button>

          <button
            onClick={() => {
              setActiveTab('competitions');
              setActiveCategory('competitions');
            }}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'competitions'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Competitions Arena
          </button>

          <button
            onClick={() => {
              setActiveTab('notes');
              setActiveCategory('notes');
            }}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semester Notes Hub
          </button>
        </div>
      </AnimatedSection>

      {/* RENDER DEDICATED SECTIONS BASED ON ACTIVE TAB */}
      {activeTab === 'competitions' && (
        <AnimatedSection direction="none" delay={0.08}>
          <CompetitionsSection initialSearch={searchQuery} />
        </AnimatedSection>
      )}

      {activeTab === 'notes' && (
        <AnimatedSection direction="none" delay={0.08}>
          <NotesSection initialYear={notesYear} initialSearch={searchQuery} />
        </AnimatedSection>
      )}

      {activeTab === 'all' && (
        <div className="space-y-6">
          
          {/* Search & Category Filter Toolbar */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by topic, or technology (e.g. C, Python)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#080b11] border border-white/[0.08] rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 hover:text-slate-300"
                    title="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Counter metadata */}
              <div className="text-xs font-mono text-slate-400 shrink-0 self-center">
                Showing <strong className="text-white">{filteredResources.length}</strong> resources
              </div>
            </div>

            {/* Clean Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all border cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold shadow-sm' 
                        : 'bg-[#0e1422] border-white/[0.07] text-slate-400 hover:text-slate-200 hover:border-white/[0.15]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>


          {/* Resources Cards Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="size-6 text-emerald-400 animate-spin" />
              <p className="text-xs font-mono text-slate-500">Loading resources catalog...</p>
            </div>
          ) : filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((res, index) => (
                <AnimatedCard key={res.id} className="flex flex-col h-full" delay={index * 0.02}>
                  <Card className="group flex flex-col h-full border-white/[0.08] bg-[#0e1422] hover:border-white/[0.16] transition-all p-5 space-y-3">
                    
                    {/* Header line: category & tag */}
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                      <span className="uppercase text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.07]">
                        {res.category.replace('-', ' ')}
                      </span>
                      {res.isFree && (
                        <span className="font-bold text-emerald-400 uppercase tracking-wider">
                          Free Access
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5 flex-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                        {res.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                        {res.description}
                      </p>
                    </div>

                    {/* Tags */}
                    {res.tags && res.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {res.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] text-slate-500 font-mono bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/[0.05]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Action */}
                    <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between">
                      {res.category === 'competitions' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('competitions');
                            setActiveCategory('competitions');
                          }}
                          className="w-full flex items-center justify-between text-xs font-mono font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          View in Competitions Arena
                          <ArrowRight className="size-3.5" />
                        </button>
                      ) : res.category === 'notes' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('notes');
                            setActiveCategory('notes');
                          }}
                          className="w-full flex items-center justify-between text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          Open Notes Vault
                          <ArrowRight className="size-3.5" />
                        </button>
                      ) : (
                        <a 
                          href={res.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-between text-xs font-mono font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group/link"
                        >
                          Open Resource
                          <ExternalLink className="size-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                        </a>
                      )}
                    </div>

                  </Card>
                </AnimatedCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#0e1422] border border-white/[0.08] rounded-2xl space-y-3">
              <p className="text-slate-400 font-mono text-xs">
                No entries match your search query or selected topic filter.
              </p>
              <div className="flex justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                  className="text-xs font-mono"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Community Contribution Footnote */}
      <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
        <span>Verified educational & developer documentation.</span>
        <span>Suggest additions in our Discord server.</span>
      </div>

    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-slate-500 font-mono text-sm">
        Loading learning resources...
      </div>
    }>
      <ResourcesPageContent />
    </Suspense>
  );
}


