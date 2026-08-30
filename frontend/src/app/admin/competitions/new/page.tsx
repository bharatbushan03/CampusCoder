'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ArrowLeft, Loader2, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createCompetition } from '@/app/actions/adminActions';
import { toast } from 'sonner';

export default function NewCompetitionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    platform: '',
    platform_url: '',
    type: 'hackathon',
    difficulty: 'All Levels',
    prize_pool: '',
    team_size: 'Solo or Team (1-4)',
    mode: 'Online',
    status: 'Registration Open',
    start_date: new Date().toISOString().slice(0, 16),
    deadline_date: '',
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    concluded_date: '',
    description: '',
    tags: 'hackathon, web, ai',
    eligibility: 'Open to all undergraduate & postgraduate students',
    perks: 'Cash prizes\nCertificates\nRecruiter visibility\nMentorship',
    checklist: 'Form a team\nReview problem statement\nSubmit project prototype before deadline',
    is_active: true,
  });

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
      toast.error('Display deadline is required (e.g. "Oct 15, 2026")');
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

      await createCompetition(payload as any);
      toast.success('Competition added successfully!');
      router.push('/admin/competitions');
    } catch (err: any) {
      toast.error('Failed to create competition: ' + (err.message || 'Check your fields'));
    } finally {
      setSubmitting(false);
    }
  };

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
            <Trophy className="h-5 w-5 text-amber-400" /> Add New Competition
          </h1>
          <p className="text-xs text-slate-400">Publish a live, upcoming, or concluded contest to the Arena.</p>
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
                placeholder="e.g. Smart India Hackathon 2026"
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
                placeholder="e.g. World's Largest Student Innovation Hackathon"
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
                placeholder="e.g. AICTE, LeetCode, Devpost, Kaggle, Google"
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
                placeholder="https://..."
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
                placeholder="e.g. Oct 15, 2026 or Every Sunday (8 AM IST)"
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
                placeholder="e.g. Dec 12, 2025"
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
                placeholder="e.g. ₹1,00,000 or $50,000 + Swag"
                value={form.prize_pool}
                onChange={(e) => setForm({ ...form, prize_pool: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Team Size</label>
              <input
                type="text"
                placeholder="e.g. 1-4 Members, 6 Members (Mandatory 1 Female)"
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
              placeholder="Brief summary of the competition, problem statements, and requirements..."
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
                placeholder="hackathon, ai, web3, algorithms"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Eligibility</label>
              <input
                type="text"
                placeholder="e.g. Open to all engineering college students"
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
              Publish immediately (visible to public)
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
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Publish Competition
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
