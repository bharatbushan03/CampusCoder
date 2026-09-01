'use client';

import React, { useState, useEffect, useMemo } from 'react';

import Link from 'next/link';
import { 
  Trophy, 
  Search, 
  ExternalLink, 
  Users, 
  Bookmark, 
  BookmarkCheck, 
  Flame, 
  Eye, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowUpDown, 
  Radio, 
  History, 
  Loader2,
  Plus
} from 'lucide-react';


import { 
  CompetitionItem, 
  CompetitionType, 
  CompetitionDifficulty,
  getCompetitionDateState,
  CompetitionDateState
} from '@/data/competitionsData';
import { CompetitionModal } from '@/components/resources/CompetitionModal';
import { AnimatedCard, AnimatedSection } from '@/components/animations/ScrollAnimations';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

interface CompetitionsSectionProps {
  initialSearch?: string;
}

type SortOption = 'smart' | 'soonest' | 'prize' | 'title';

export function CompetitionsSection({ initialSearch = '' }: CompetitionsSectionProps) {
  const { profile } = useAuth();
  const isAdminOrOrganizer = profile && (profile.role === 'admin' || profile.role === 'organizer');

  const [competitions, setCompetitions] = useState<CompetitionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(initialSearch);
  const [selectedType, setSelectedType] = useState<CompetitionType>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<CompetitionDifficulty | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'concluded'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('smart');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [activeModalCompetition, setActiveModalCompetition] = useState<CompetitionItem | null>(null);

  // Sync initialSearch if prop changes
  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  // Load bookmarks
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cc_bookmarked_competitions');
      if (saved) {
        setBookmarkedIds(JSON.parse(saved));
      }
    } catch {
      setBookmarkedIds([]);
    }
  }, []);

  // Fetch dynamic competitions from backend API
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const data = await api<{ ok: boolean; competitions: any[] }>('/competitions');
        if (data && data.ok && Array.isArray(data.competitions)) {
          const mapped: CompetitionItem[] = data.competitions.map(c => ({
            id: c.id,
            title: c.title,
            subtitle: c.subtitle || '',
            platform: c.platform,
            platformUrl: c.platform_url || c.platformUrl || '#',
            type: c.type as CompetitionType,
            difficulty: (c.difficulty || 'All Levels') as CompetitionDifficulty,
            prizePool: c.prize_pool || c.prizePool || 'Certificate & Swag',
            teamSize: c.team_size || c.teamSize || 'Solo or Team',
            mode: (c.mode || 'Online') as any,
            status: (c.status || 'Upcoming') as any,
            startDate: c.start_date || c.startDate,
            deadlineDate: c.deadline_date || c.deadlineDate || 'TBA',
            targetDate: c.target_date || c.targetDate || new Date().toISOString(),
            concludedDate: c.concluded_date || c.concludedDate,
            description: c.description || '',
            tags: Array.isArray(c.tags) ? c.tags : [],
            bannerGradient: c.banner_gradient || c.bannerGradient || 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
            perks: Array.isArray(c.perks) ? c.perks : ['Certificates', 'Networking', 'Learning'],
            eligibility: c.eligibility || 'Open to all students & developers',
            timeline: Array.isArray(c.timeline) ? c.timeline : [],
            prepKit: Array.isArray(c.prep_kit) ? c.prep_kit : (Array.isArray(c.prepKit) ? c.prepKit : []),
            checklist: Array.isArray(c.checklist) ? c.checklist : [],
            featured: c.featured,
          }));

          setCompetitions(mapped);
        } else {
          setCompetitions([]);
        }
      } catch (err) {
        console.warn('Failed to load dynamic competitions:', err);
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchCompetitions();
  }, []);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (bookmarkedIds.includes(id)) {
      updated = bookmarkedIds.filter(item => item !== id);
    } else {
      updated = [...bookmarkedIds, id];
    }
    setBookmarkedIds(updated);
    localStorage.setItem('cc_bookmarked_competitions', JSON.stringify(updated));
  };

  const typeFilters: { id: CompetitionType; label: string }[] = [
    { id: 'all', label: 'All Tracks' },
    { id: 'hackathon', label: 'Hackathons' },
    { id: 'competitive-programming', label: 'Competitive Programming' },
    { id: 'ai-data', label: 'AI & Data Science' },
    { id: 'open-source', label: 'Open Source' },
    { id: 'flagship', label: 'Global Flagships' },
  ];

  const difficultyLevels: (CompetitionDifficulty | 'All')[] = ['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'];


  // Global counts based on dynamic competitions
  const globalCounts = useMemo(() => {
    let live = 0;
    let upcoming = 0;
    let concluded = 0;

    competitions.forEach(comp => {
      const state = getCompetitionDateState(comp);
      if (state === 'live') live++;
      else if (state === 'upcoming') upcoming++;
      else if (state === 'concluded') concluded++;
    });

    return { live, upcoming, concluded, total: competitions.length };
  }, [competitions]);

  // Filter competitions
  const filteredList = useMemo(() => {
    return competitions.filter(comp => {
      const matchesSearch = comp.title.toLowerCase().includes(search.toLowerCase()) ||
                            comp.subtitle.toLowerCase().includes(search.toLowerCase()) ||
                            comp.description.toLowerCase().includes(search.toLowerCase()) ||
                            comp.platform.toLowerCase().includes(search.toLowerCase()) ||
                            comp.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

      const matchesType = selectedType === 'all' || comp.type === selectedType;
      const matchesDiff = selectedDifficulty === 'All' || comp.difficulty === selectedDifficulty;
      const matchesBookmark = onlyBookmarked ? bookmarkedIds.includes(comp.id) : true;

      const dateState = getCompetitionDateState(comp);
      const matchesStatus = statusFilter === 'all' ? true : dateState === statusFilter;

      return matchesSearch && matchesType && matchesDiff && matchesBookmark && matchesStatus;
    });
  }, [competitions, search, selectedType, selectedDifficulty, onlyBookmarked, bookmarkedIds, statusFilter]);

  // Group into Live, Upcoming, and Concluded
  const { liveCompetitions, upcomingCompetitions, concludedCompetitions } = useMemo(() => {
    const live: CompetitionItem[] = [];
    const upcoming: CompetitionItem[] = [];
    const concluded: CompetitionItem[] = [];

    filteredList.forEach(comp => {
      const state = getCompetitionDateState(comp);
      if (state === 'live') live.push(comp);
      else if (state === 'upcoming') upcoming.push(comp);
      else concluded.push(comp);
    });

    const sortFn = (a: CompetitionItem, b: CompetitionItem) => {
      if (sortBy === 'soonest') {
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      // default: soonest within section
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    };

    live.sort(sortFn);
    upcoming.sort(sortFn);
    concluded.sort((a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime());

    return {
      liveCompetitions: live,
      upcomingCompetitions: upcoming,
      concludedCompetitions: concluded,
    };
  }, [filteredList, sortBy]);

  const totalFilteredCount = liveCompetitions.length + upcomingCompetitions.length + concludedCompetitions.length;

  const renderCard = (comp: CompetitionItem, index: number, dateState: CompetitionDateState) => {
    const isBookmarked = bookmarkedIds.includes(comp.id);
    const isLive = dateState === 'live';
    const isConcluded = dateState === 'concluded';

    return (
      <AnimatedCard key={comp.id} className="flex flex-col h-full" delay={index * 0.04}>
        <div 
          onClick={() => setActiveModalCompetition(comp)}
          className={`group relative flex flex-col h-full rounded-2xl border transition-all p-5 space-y-4 cursor-pointer overflow-hidden ${
            isLive
              ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 via-slate-950/80 to-slate-950 shadow-lg shadow-emerald-500/5 hover:border-emerald-400'
              : isConcluded
                ? 'border-slate-800/60 bg-slate-950/40 opacity-80 hover:opacity-100 hover:border-slate-700'
                : 'border-slate-800/90 bg-slate-950/60 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5'
          }`}
        >
          {/* Subtle Top Gradient */}
          <div className={`absolute top-0 inset-x-0 h-28 bg-gradient-to-b ${comp.bannerGradient} pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity`} />

          {/* Card Header */}
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isLive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isConcluded
                    ? 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              }`}>
                {comp.platform}
              </span>
              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                {comp.mode}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => toggleBookmark(comp.id, e)}
                className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-slate-700 transition-colors cursor-pointer"
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark competition'}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-amber-400" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Status Badge & Title */}
          <div className="relative space-y-1.5 flex-1">
            <div className="flex items-center gap-1.5">
              {isLive ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                    <Radio className="h-3 w-3 animate-pulse" /> LIVE NOW
                  </span>
                </>
              ) : isConcluded ? (
                <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-slate-500" /> Concluded
                </span>
              ) : (
                <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase flex items-center gap-1">
                  <Clock className="h-3 w-3 text-cyan-400" /> {comp.status}
                </span>
              )}
            </div>

            <h3 className={`text-base font-bold transition-colors leading-snug ${
              isLive ? 'text-white group-hover:text-emerald-300' : isConcluded ? 'text-slate-300 group-hover:text-white' : 'text-white group-hover:text-emerald-400'
            }`}>
              {comp.title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              {comp.description}
            </p>
          </div>

          {/* Date & Deadline Bar */}
          <div className="relative flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] font-mono">
            {isLive ? (
              <>
                <Flame className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-amber-300 font-semibold truncate">Target: {comp.deadlineDate}</span>
              </>
            ) : isConcluded ? (
              <>
                <History className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-400 truncate">Concluded: {comp.concludedDate || comp.deadlineDate}</span>
              </>
            ) : (
              <>
                <Calendar className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span className="text-slate-300 truncate">Deadline: {comp.deadlineDate}</span>
              </>
            )}
          </div>

          {/* Highlights Grid */}
          <div className="relative grid grid-cols-2 gap-2 pt-2 border-t border-slate-900">
            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800/60">
              <div className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1">
                <Trophy className="h-2.5 w-2.5 text-amber-400" /> Prize
              </div>
              <div className="text-[11px] font-bold text-white truncate" title={comp.prizePool}>
                {comp.prizePool}
              </div>
            </div>

            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800/60">
              <div className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1">
                <Users className="h-2.5 w-2.5 text-cyan-400" /> Team
              </div>
              <div className="text-[11px] font-bold text-white truncate" title={comp.teamSize}>
                {comp.teamSize}
              </div>
            </div>
          </div>

          {/* Tags */}
          {comp.tags.length > 0 && (
            <div className="relative flex flex-wrap gap-1">
              {comp.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[9px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800/60 font-mono">
                  #{tag}
                </span>
              ))}
              {comp.tags.length > 3 && (
                <span className="text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded-md font-mono">
                  +{comp.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="relative pt-3 border-t border-slate-900 flex items-center justify-between gap-2">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold transition-colors cursor-pointer ${
                isLive ? 'text-emerald-300 hover:text-emerald-200' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              {isConcluded ? 'View Archive & Prep Kit' : 'Quick View & Checklist'}
            </button>

            <a
              href={comp.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-emerald-500/40 transition-colors"
              title="Direct Link to Platform"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </AnimatedCard>
    );
  };

  return (
    <div className="space-y-6">
      {/* Interactive Controls Bar */}
      <div className="space-y-4">
        {/* Track Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {typeFilters.map(filter => {
            const isActive = selectedType === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedType(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-[#0e1422] border border-white/[0.08] text-slate-400 hover:border-white/[0.2] hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>


        {/* Date Status View Switcher Pills: Live, Concluded, Upcoming, All */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white/[0.1] text-white border border-white/[0.2]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Arenas ({globalCounts.total})
          </button>

          <button
            onClick={() => setStatusFilter('live')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer ${
              statusFilter === 'live'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
            Live Arenas ({globalCounts.live})
          </button>

          <button
            onClick={() => setStatusFilter('concluded')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer ${
              statusFilter === 'concluded'
                ? 'bg-white/[0.08] text-slate-200 border border-white/[0.15]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="size-3.5" />
            Concluded ({globalCounts.concluded})
          </button>

          <button
            onClick={() => setStatusFilter('upcoming')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer ${
              statusFilter === 'upcoming'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-cyan-400'
            }`}
          >
            <Clock className="size-3.5" />
            Upcoming ({globalCounts.upcoming})
          </button>
        </div>

        {/* Second Row: Search, Difficulty, Sorting & Bookmarks */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search competitions, platforms (e.g. LeetCode, Kaggle)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Difficulty Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer appearance-none pr-8"
              >
                {difficultyLevels.map(diff => (
                  <option key={diff} value={diff}>
                    Difficulty: {diff}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer appearance-none pr-8"
              >
                <option value="smart">Sort: Smart (Live → Upcoming → Concluded)</option>
                <option value="soonest">Sort: Ending / Starting Soonest</option>
                <option value="title">Sort: Alphabetical (A-Z)</option>
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Bookmarks Toggle */}
            <button
              onClick={() => setOnlyBookmarked(!onlyBookmarked)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
                onlyBookmarked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {onlyBookmarked ? <BookmarkCheck className="h-3.5 w-3.5 text-amber-400" /> : <Bookmark className="h-3.5 w-3.5" />}
              <span>Saved ({bookmarkedIds.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTIONS: 1. LIVE (TOP), 2. UPCOMING (MIDDLE), 3. CONCLUDED (BOTTOM) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="size-8 text-emerald-400 animate-spin" />
          <p className="text-xs font-mono text-slate-500">Loading live arena competitions...</p>
        </div>
      ) : totalFilteredCount > 0 ? (
        <div className="space-y-12">
          {/* SECTION 1: LIVE COMPETITIONS (ON TOP) */}
          {liveCompetitions.length > 0 && (
            <AnimatedSection direction="up" className="space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    Live Competitions <span className="text-xs font-normal text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{liveCompetitions.length} Active Now</span>
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">Active arena rounds open for immediate participation</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveCompetitions.map((comp, idx) => renderCard(comp, idx, 'live'))}
              </div>
            </AnimatedSection>
          )}

          {/* SECTION 2: UPCOMING & OPEN COMPETITIONS (MIDDLE) */}
          {upcomingCompetitions.length > 0 && (
            <AnimatedSection direction="up" className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Clock className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    Upcoming & Open Registrations <span className="text-xs font-normal text-cyan-400 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">{upcomingCompetitions.length} Open</span>
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">Register early & prepare team checklists</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingCompetitions.map((comp, idx) => renderCard(comp, idx, 'upcoming'))}
              </div>
            </AnimatedSection>
          )}

          {/* SECTION 3: CONCLUDED COMPETITIONS (BOTTOM) */}
          {concludedCompetitions.length > 0 && (
            <AnimatedSection direction="up" className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                    <History className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-300 font-mono flex items-center gap-2">
                    Concluded Competitions & Past Archives <span className="text-xs font-normal text-slate-400 font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">{concludedCompetitions.length} Past</span>
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">Explore winning solutions & past problem sets</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {concludedCompetitions.map((comp, idx) => renderCard(comp, idx, 'concluded'))}
              </div>
            </AnimatedSection>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-950/40 border border-slate-800 rounded-3xl space-y-4">
          <Trophy className="h-10 w-10 text-slate-700 mx-auto" />
          <p className="text-slate-400 font-mono text-sm">
            {search || selectedType !== 'all' || selectedDifficulty !== 'All' || statusFilter !== 'all'
              ? 'No competitions matched your search or filters.'
              : 'No competitions found in the arena.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {(search || selectedType !== 'all' || selectedDifficulty !== 'All' || statusFilter !== 'all' || onlyBookmarked) && (
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSelectedDifficulty('All');
                  setStatusFilter('all');
                  setOnlyBookmarked(false);
                  setSearch('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Reset Competition Filters
              </button>
            )}
            {isAdminOrOrganizer && (
              <Link href="/admin/competitions/new">
                <Button size="sm" className="bg-emerald-500 text-slate-950 font-bold font-mono text-xs">
                  <Plus className="size-3.5" /> Add First Competition
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Interactive Detail Modal */}
      <CompetitionModal
        competition={activeModalCompetition}
        isOpen={!!activeModalCompetition}
        onClose={() => setActiveModalCompetition(null)}
      />
    </div>
  );
}


