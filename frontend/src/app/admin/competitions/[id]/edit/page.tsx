'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ArrowLeft, Loader2, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { updateCompetition } from '@/app/actions/adminActions';
import { toast } from 'sonner';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditCompetitionPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    platform: '',
    platform_url: '',
    type: 'hackathon',
    difficulty: 'All Levels',
    prize_pool: '',
    team_size: '',
    mode: 'Online',
    status: 'Registration Open',
    start_date: '',
    deadline_date: '',
    target_date: '',
    concluded_date: '',
    description: '',
    tags: '',
    eligibility: '',
    perks: '',
    checklist: '',
    is_active: true,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api<{ ok: boolean; competition: any }>(`/admin/competitions/${id}`);
        if (res && res.ok && res.competition) {
          const comp = res.competition;
          setForm({
            title: comp.title || '',
            subtitle: comp.subtitle || '',
            platform: comp.platform || '',
            platform_url: comp.platform_url || '',
            type: comp.type || 'hackathon',
            difficulty: comp.difficulty || 'All Levels',
            prize_pool: comp.prize_pool || '',
            team_size: comp.team_size || '',
            mode: comp.mode || 'Online',
            status: comp.status || 'Upcoming',
            start_date: comp.start_date ? new Date(comp.start_date).toISOString().slice(0, 16) : '',
            deadline_date: comp.deadline_date || '',
            target_date: comp.target_date ? new Date(comp.target_date).toISOString().slice(0, 16) : '',
            concluded_date: comp.concluded_date || '',
            description: comp.description || '',
            tags: Array.isArray(comp.tags) ? comp.tags.join(', ') : '',
            eligibility: comp.eligibility || '',
            perks: Array.isArray(comp.perks) ? comp.perks.join('\n') : '',
            checklist: Array.isArray(comp.checklist) ? comp.checklist.join('\n') : '',
            is_active: comp.is_active ?? true,
          });
        }
      } catch (err: any) {
        toast.error('Failed to load competition: ' + (err.message || 'Error'));
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Competition title is required');
      return;
    }
    if (!form.platform.trim()) {
      toast.error('Platform name is required');
      return;
    }
    if (!form.platform_url.trim()) {
      toast.error('Platform URL is required');
      return;
    }
    if (!form.deadline_date.trim()) {
      toast.error('Display deadline is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        platform: form.platform.trim(),
        platform_url: form.platform_url.trim(),
        type: form.type,
        difficulty: form.difficulty,
        prize_pool: form.prize_pool.trim() || undefined,
        team_size: form.team_size.trim() || undefined,
        mode: form.mode,
        status: form.status,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : undefined,
        deadline_date: form.deadline_date.trim(),
        target_date: new Date(form.target_date).toISOString(),
        concluded_date: form.concluded_date.trim() || undefined,
        description: form.description.trim() || undefined,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        perks: form.perks.split('\n').map(p => p.trim()).filter(Boolean),
        checklist: form.checklist.split('\n').map(c => c.trim()).filter(Boolean),
        eligibility: form.eligibility.trim() || undefined,
        is_active: form.is_active,
        timeline: [],
        prep_kit: [],
      };

      await updateCompetition(id, payload as any);
      toast.success('Competition updated successfully!');
      router.push('/admin/competitions');
    } catch (err: any) {
      toast.error('Failed to update competition: ' + (err.message || 'Check fields'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 bg-slate-900" />
        <Skeleton className="h-96 w-full rounded-2xl bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/competitions">
          <Button variant="outline" size="sm" className="font-mono text-xs border-slate-700">
            <ArrowLeft className="size-3.5" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" /> Edit Competition
          </h1>
          <p className="text-xs text-slate-400">Update timeline, status, details, or visibility.</p>
        </div>
      </div>

      <Card className="bg-slate-950/70 border-slate-800 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Competition Title <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Row 2: Platform & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Platform / Host Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Platform / Registration Link <span className="text-emerald-400">*</span>
              </label>
              <input
                type="url"
                required
                value={form.platform_url}
                onChange={(e) => setForm({ ...form, platform_url: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Row 3: Track, Difficulty, Mode, Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Track</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="hackathon">Hackathon</option>
                <option value="competitive-programming">Competitive Programming</option>
                <option value="ai-data">AI & Data Science</option>
                <option value="open-source">Open Source</option>
                <option value="flagship">Global Flagship</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="All Levels">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Mode</label>
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="Live Now">Live Now (On Top)</option>
                <option value="Registration Open">Registration Open</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Weekly Recurring">Weekly Recurring</option>
                <option value="Annual Flagship">Annual Flagship</option>
                <option value="Concluded">Concluded (At Bottom)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Display Deadline Text <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.deadline_date}
                onChange={(e) => setForm({ ...form, deadline_date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Target Countdown Date/Time <span className="text-emerald-400">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={form.target_date}
                onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Concluded Date (if ended)
              </label>
              <input
                type="text"
                value={form.concluded_date}
                onChange={(e) => setForm({ ...form, concluded_date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Row 5: Prize & Team */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Prize Pool</label>
              <input
                type="text"
                value={form.prize_pool}
                onChange={(e) => setForm({ ...form, prize_pool: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Team Size</label>
              <input
                type="text"
                value={form.team_size}
                onChange={(e) => setForm({ ...form, team_size: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-slate-300">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Tags & Eligibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Tags (comma separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Eligibility</label>
              <input
                type="text"
                value={form.eligibility}
                onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Perks & Checklist (One per line) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Key Perks (One per line)</label>
              <textarea
                rows={3}
                value={form.perks}
                onChange={(e) => setForm({ ...form, perks: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Preparation Checklist (One per line)</label>
              <textarea
                rows={3}
                value={form.checklist}
                onChange={(e) => setForm({ ...form, checklist: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>
          </div>

          {/* Visibility Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="is_active" className="text-xs font-mono text-slate-300 cursor-pointer">
              Visible to public
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
            <Link href="/admin/competitions">
              <Button type="button" variant="outline" size="sm" className="font-mono text-xs border-slate-700">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="font-mono text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
