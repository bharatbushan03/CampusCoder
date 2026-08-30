'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Server,
  Trophy,
  GraduationCap,
  Layers,
  ArrowRight,
  Settings,
  PlusCircle,
  Loader2
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

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic resources from backend API
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await api<{ ok: boolean; resources: BackendResource[] }>('/resources');
        if (data && data.ok && Array.isArray(data.resources)) {
          const mapped: Resource[] = data.resources.map(r => ({
            id: r.id,
            title: r.title,
            description: r.description || '',
            url: r.link,
            category: r.category as ResourceCategory,
            isFree: true,
            tags: [r.category.replace('-', ' ')],
          }));

          setResources(mapped);
        } else {
          setResources([]);
        }
      } catch (err) {
        console.warn('Dynamic resources fetch failed:', err);
        setResources([]);
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

  const categories: { id: ResourceCategory | 'all', label: string, icon: any, isSpecial?: boolean }[] = [
    { id: 'all', label: 'All Resources', icon: BookOpen },
    { id: 'competitions', label: 'Competitions', icon: Trophy, isSpecial: true },
    { id: 'notes', label: '1st & 2nd Yr Notes', icon: GraduationCap, isSpecial: true },
    { id: 'dsa', label: 'DSA & Practice', icon: DatabaseIcon },
    { id: 'free-tools', label: 'Free Tools', icon: TerminalSquare },
    { id: 'courses', label: 'Courses', icon: Video },
    { id: 'roadmaps', label: 'Roadmaps', icon: Map },
    { id: 'interview-prep', label: 'Interviews', icon: Briefcase },
    { id: 'system-design', label: 'System Design', icon: Server },
    { id: 'open-source', label: 'Open Source', icon: Users },
    { id: 'hackathons', label: 'Hackathons', icon: Code },
    { id: 'certifications', label: 'Certifications', icon: Award },
  ];

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

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    if (cat && cat.icon) {
      const Icon = cat.icon;
      return <Icon className="h-5 w-5 text-emerald-400" />;
    }
    return <BookOpen className="h-5 w-5 text-emerald-400" />;
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' ? true : res.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Hero Header */}
      <AnimatedSection className="space-y-4 text-center max-w-3xl mx-auto" direction="up">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> Learning Hub & Competitions Arena
          </div>

          {isAdminOrOrganizer && (
            <Link
              href="/admin/resources"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 text-[10px] font-mono font-semibold transition-all"
            >
              <Settings className="h-3 w-3 text-emerald-400" />
              Manage Resources
            </Link>
          )}
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-mono">
          Developer <span className="text-emerald-500">Resources</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Curated guides, tools, collegiate competitions, and 1st & 2nd year engineering notes for developers and students.
        </p>

        {isAdminOrOrganizer && (
          <div className="pt-2 flex justify-center gap-3">
            <Link href="/admin/resources/new">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs font-mono border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                <PlusCircle className="size-3.5" /> Add New Resource
              </Button>
            </Link>
          </div>
        )}
      </AnimatedSection>

      {/* Main View Mode Selector (All vs Competitions Arena vs Notes Hub) */}
      <AnimatedSection className="flex justify-center" direction="none" delay={0.05}>
        <div className="inline-flex p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-xl">
          <button
            onClick={() => {
              setActiveTab('all');
              setActiveCategory('all');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Explore All</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('competitions');
              setActiveCategory('competitions');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'competitions'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="h-4 w-4 text-amber-400" />
            <span>🏆 Competitions Arena</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('notes');
              setActiveCategory('notes');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="h-4 w-4 text-blue-400" />
            <span>📚 1st & 2nd Year Notes</span>
          </button>
        </div>
      </AnimatedSection>

      {/* RENDER DEDICATED SECTIONS BASED ON ACTIVE TAB */}
      {activeTab === 'competitions' && (
        <AnimatedSection direction="none" delay={0.1}>
          <CompetitionsSection initialSearch={searchQuery} />
        </AnimatedSection>
      )}

      {activeTab === 'notes' && (
        <AnimatedSection direction="none" delay={0.1}>
          <NotesSection initialYear={notesYear} initialSearch={searchQuery} />
        </AnimatedSection>
      )}

      {activeTab === 'all' && (
        <div className="space-y-10">
          {/* Quick Jump Hero Cards for Competitions & Notes */}
          <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 gap-6" direction="up" delay={0.08}>
            {/* Competitions Card */}
            <div 
              onClick={() => {
                setActiveTab('competitions');
                setActiveCategory('competitions');
              }}
              className="group relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 p-6 space-y-3 cursor-pointer hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Trophy className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Interactive Hub
                </span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors font-mono">
                Competitions & Hackathons
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live countdowns, readiness checklists, and prize trackers for SIH, LeetCode Weekly, ICPC, and Devpost Hackathons.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                <span>Enter Arena</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Notes Card */}
            <div 
              onClick={() => {
                setActiveTab('notes');
                setActiveCategory('notes');
              }}
              className="group relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-slate-950 to-slate-950 p-6 space-y-3 cursor-pointer hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/5"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Sem 1 to Sem 4
                </span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors font-mono">
                1st & 2nd Year Engineering Notes
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Subject handbooks, syllabus modules, formula cheat sheets, lecture playlists, and PYQs for 1st Year and 2nd Year CS.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>Browse Notes Hub</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </AnimatedSection>

          {/* Category Tabs */}
          <AnimatedSection className="flex flex-wrap justify-center gap-2" direction="none" delay={0.1}>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all border cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold' 
                      : cat.isSpecial
                        ? 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-emerald-500/40 hover:text-white'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </AnimatedSection>

          {/* Search Bar */}
          <AnimatedSection className="relative max-w-xl mx-auto" direction="none" delay={0.15}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tools, notes, competitions, courses, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors shadow-2xl"
            />
          </AnimatedSection>

          {/* Dynamic Resources Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="size-8 text-emerald-400 animate-spin" />
              <p className="text-xs font-mono text-slate-500">Fetching latest learning resources...</p>
            </div>
          ) : filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((res, index) => (
                <AnimatedCard key={res.id} className="flex flex-col h-full" delay={index * 0.04}>
                  <Card className="group flex flex-col h-full border-slate-800 bg-slate-950/40 hover:border-emerald-500/30 transition-all p-6 space-y-4">
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
                            <span key={tag} className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded-md font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                      {res.category === 'competitions' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('competitions');
                            setActiveCategory('competitions');
                          }}
                          className="w-full flex items-center justify-between text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors group/link cursor-pointer"
                        >
                          View in Competitions Arena
                          <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                        </button>
                      ) : res.category === 'notes' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('notes');
                            setActiveCategory('notes');
                            if (res.id === 'note-res-2') {
                              setNotesYear('2nd-year');
                            } else {
                              setNotesYear('1st-year');
                            }
                          }}
                          className="w-full flex items-center justify-between text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors group/link cursor-pointer"
                        >
                          Open Notes Hub
                          <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                        </button>
                      ) : (
                        <a 
                          href={res.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-between text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors group/link"
                        >
                          Visit resource
                          <ExternalLink className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                        </a>
                      )}
                    </div>
                  </Card>
                </AnimatedCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-950/40 border border-slate-800 rounded-3xl space-y-4">
              <BookOpen className="h-10 w-10 text-slate-700 mx-auto" />
              <p className="text-slate-400 font-mono text-sm">
                {searchQuery || activeCategory !== 'all' ? 'No resources matched your search or category filter.' : 'No resources found in the library.'}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {(searchQuery || activeCategory !== 'all') && (
                  <Button variant="outline" size="sm" onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}>
                    Clear Filters
                  </Button>
                )}
                {isAdminOrOrganizer && (
                  <Link href="/admin/resources/new">
                    <Button size="sm" className="bg-emerald-500 text-slate-950 font-bold font-mono text-xs">
                      <PlusCircle className="size-3.5" /> Add Resource
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Community Call to Action */}
      <div className="pt-12 text-center border-t border-slate-900/80">
        <p className="text-xs text-slate-500 font-mono">
          Know a great hackathon, contest, or semester notes repository? Share it on Discord.
        </p>
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

