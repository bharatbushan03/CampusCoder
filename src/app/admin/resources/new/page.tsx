'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Globe, FileText, Link2, Info } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function NewResourcePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    link: '',
    category: 'roadmaps',
    event_id: '',
    is_active: true
  });

  useEffect(() => {
    const loadEvents = async () => {
      const supabase = createClient() as any;
      const { data } = await supabase.from('events').select('id, title').order('date', { ascending: false });
      setEvents(data || []);
    };
    loadEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const supabase = createClient() as any;
      const { error } = await supabase.from('resources').insert({
        ...form,
        event_id: form.event_id || null
      });
      if (error) throw error;
      router.push('/admin/resources');
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <Link href="/admin/resources" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Library
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">Add <span className="text-emerald-500">Resource</span></h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-900 bg-slate-950/40 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <FileText className="h-3 w-3 text-emerald-400" /> Resource Title
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              placeholder="e.g. Full Stack Web Dev Roadmap"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Globe className="h-3 w-3 text-emerald-400" /> External Link
            </label>
            <input
              type="url"
              required
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Info className="h-3 w-3 text-emerald-400" /> Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="roadmaps">Roadmaps</option>
                <option value="practice">Practice</option>
                <option value="dsa">DSA Kits</option>
                <option value="placement">Placements</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Link2 className="h-3 w-3 text-emerald-400" /> Related Event (Optional)
              </label>
              <select
                value={form.event_id}
                onChange={(e) => setForm({ ...form, event_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">No related event</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none"
              placeholder="Briefly describe what this resource is about..."
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
            />
            <label htmlFor="is_active" className="text-sm text-slate-400 cursor-pointer">
              Visible to public
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isSubmitting}
            className="flex items-center gap-2 font-bold px-8"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Resource
          </Button>
        </div>
      </form>
    </div>
  );
}
