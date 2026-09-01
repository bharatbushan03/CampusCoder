'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Plus, 
  Search, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar, 
  RefreshCw,
  Database
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { deleteCompetition, toggleCompetition } from '@/app/actions/adminActions';
import { toast } from 'sonner';
import { getCompetitionDateState } from '@/data/competitionsData';

export type AdminCompetitionRow = {
  id: string;
  title: string;
  subtitle: string | null;
  platform: string;
  platform_url: string;
  type: string;
  difficulty: string;
  prize_pool: string | null;
  team_size: string | null;
  mode: string;
  status: string;
  start_date: string | null;
  deadline_date: string;
  target_date: string;
  concluded_date: string | null;
  description: string | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
};

export default function AdminCompetitionsPage() {
  const [competitions, setCompetitions] = useState<AdminCompetitionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ ok: boolean; competitions: AdminCompetitionRow[] }>('/admin/competitions');
      if (data && data.ok) {
        setCompetitions(data.competitions || []);
      }
    } catch (err: any) {
      toast.error('Failed to load competitions: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCompetitions();
  }, [fetchCompetitions]);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setCompetitions(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
    try {
      await toggleCompetition(id);
      toast.success(currentStatus ? 'Competition hidden' : 'Competition made visible');
    } catch (err: any) {
      toast.error('Failed to toggle: ' + (err.message || 'Error'));
      void fetchCompetitions();
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    // Optimistic UI update
    setCompetitions(prev => prev.filter(c => c.id !== id));
    try {
      await deleteCompetition(id);
      toast.success(`Deleted "${title}"`);
    } catch (err: any) {
      toast.error('Failed to delete: ' + (err.message || 'Error'));
      void fetchCompetitions();
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await api<{ ok: boolean; message: string }>('/admin/competitions/seed', {
        method: 'POST',
      });
      if (res && res.ok) {
        toast.success(res.message || 'Seeded competitions successfully!');
        void fetchCompetitions();
      }
    } catch (err: any) {
      toast.error('Failed to seed: ' + (err.message || 'Error'));
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredCompetitions = useMemo(() => {
    return competitions.filter(comp => {
      const matchesSearch = comp.title.toLowerCase().includes(search.toLowerCase()) ||
                            comp.platform.toLowerCase().includes(search.toLowerCase()) ||
                            (comp.description && comp.description.toLowerCase().includes(search.toLowerCase())) ||
                            comp.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

      const matchesType = typeFilter === 'all' || comp.type === typeFilter;
      
      const dateState = getCompetitionDateState(comp as any);
      const matchesStatus = statusFilter === 'all' || 
                            comp.status.toLowerCase() === statusFilter.toLowerCase() ||
                            dateState === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [competitions, search, typeFilter, statusFilter]);

  const counts = useMemo(() => {
    let live = 0;
    let upcoming = 0;
    let concluded = 0;
    competitions.forEach(c => {
      const state = getCompetitionDateState(c as any);
      if (state === 'live') live++;
      else if (state === 'upcoming') upcoming++;
      else concluded++;
    });
    return { total: competitions.length, live, upcoming, concluded };
  }, [competitions]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" /> Competitions Arena Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create, edit, toggle visibility, and order collegiate hackathons & contests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCompetitions}
            className="flex items-center gap-1.5 font-mono text-xs border-slate-700"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Link href="/admin/competitions/new">
            <Button size="sm" className="flex items-center gap-1.5 font-mono text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">
              <Plus className="size-4" /> Add Competition
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Total Arenas</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{counts.total}</div>
        </Card>

        <Card className="bg-slate-900/60 border-emerald-500/20 p-4">
          <div className="text-[10px] font-mono text-emerald-400 uppercase flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Arenas
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{counts.live}</div>
        </Card>

        <Card className="bg-slate-900/60 border-cyan-500/20 p-4">
          <div className="text-[10px] font-mono text-cyan-400 uppercase">Upcoming & Open</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">{counts.upcoming}</div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Concluded Archives</div>
          <div className="text-2xl font-bold text-slate-300 font-mono mt-1">{counts.concluded}</div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search competitions by platform"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="all">Track: All Tracks</option>
          <option value="hackathon">Hackathon</option>
          <option value="competitive-programming">Competitive Programming</option>
          <option value="ai-data">AI & Data Science</option>
          <option value="open-source">Open Source</option>
          <option value="flagship">Global Flagship</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="all">Status: All Statuses</option>
          <option value="live">🔴 Live Now</option>
          <option value="upcoming">⚡ Upcoming & Open</option>
          <option value="concluded">🏁 Concluded</option>
        </select>
      </div>

      {/* Competitions Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl bg-slate-900/60" />
          ))}
        </div>
      ) : filteredCompetitions.length > 0 ? (
        <div className="space-y-3">
          {filteredCompetitions.map((comp) => {
            const dateState = getCompetitionDateState(comp as any);
            const isLive = dateState === 'live';
            const isConcluded = dateState === 'concluded';

            return (
              <Card 
                key={comp.id}
                className={`p-4 bg-slate-950/60 border transition-all ${
                  !comp.is_active
                    ? 'border-slate-900 opacity-60'
                    : isLive
                      ? 'border-emerald-500/30 shadow-md shadow-emerald-500/5'
                      : isConcluded
                        ? 'border-slate-800/80'
                        : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                        {comp.platform}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-900 text-slate-400">
                        {comp.type}
                      </span>
                      {isLive ? (
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Live
                        </span>
                      ) : isConcluded ? (
                        <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                          Concluded
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {comp.status}
                        </span>
                      )}

                      {!comp.is_active && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] text-amber-400 bg-amber-500/10 border border-amber-400/30 font-mono">
                          Hidden
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white font-mono truncate">
                      {comp.title}
                    </h3>

                    {comp.subtitle && (
                      <p className="text-xs text-slate-400 truncate">
                        {comp.subtitle}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-purple-400" />
                        Deadline: {comp.deadline_date || comp.target_date?.substring(0, 10)}
                      </span>
                      {comp.prize_pool && (
                        <span className="flex items-center gap-1 text-amber-300">
                          <Trophy className="h-3 w-3 text-amber-400" />
                          {comp.prize_pool}
                        </span>
                      )}
                      {comp.mode && (
                        <span className="text-slate-500">
                          Mode: {comp.mode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-900">
                    <a
                      href={comp.platform_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                      title="Open external platform link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleToggle(comp.id, comp.is_active)}
                      className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                        comp.is_active
                          ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}
                      title={comp.is_active ? 'Hide competition' : 'Show competition'}
                    >
                      {comp.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>

                    <Link href={`/admin/competitions/${comp.id}/edit`}>
                      <button
                        type="button"
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors cursor-pointer"
                        title="Edit competition"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(comp.id, comp.title)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors cursor-pointer"
                      title="Delete competition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-950/40 border border-slate-800 rounded-3xl space-y-4">
          <Trophy className="h-10 w-10 text-slate-700 mx-auto" />
          <p className="text-slate-400 font-mono text-sm">No competitions found in the library.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/admin/competitions/new">
              <Button size="sm" className="bg-emerald-500 text-slate-950 font-bold font-mono text-xs">
                <Plus className="size-3.5" /> Add First Competition
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={isSeeding}
              className="border-slate-700 text-xs font-mono text-slate-300"
            >
              <Database className="size-3.5 text-amber-400" />
              {isSeeding ? 'Seeding...' : 'Seed Curated Default Competitions'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
