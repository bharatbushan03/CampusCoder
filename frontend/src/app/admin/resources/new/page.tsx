'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Globe, FileText, Link2, Info } from 'lucide-react';
import Link from 'next/link';
import { createResource } from '@/app/actions/adminActions';
import { resourceSchema } from '@backend/lib/validation';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@backend/utils/supabase/client';
import type { Database } from '@/types/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];
type EventOption = Pick<EventRow, 'id' | 'title'>;

export default function NewResourcePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<EventOption[]>([]);

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
      const supabase = createClient();
      const { data } = await supabase
        .from('events')
        .select('id, title')
        .order('date', { ascending: false })
        .returns<EventOption[]>();
      setEvents(data || []);
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      link: form.link.trim(),
      event_id: form.event_id || null
    };

    const validation = resourceSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      await createResource(payload);
      toast.success('Resource added');
      router.push('/admin/resources');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <Link href="/admin/resources" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
          <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Library
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">Add <span className="text-emerald-500">Resource</span></h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-900 bg-slate-950/40 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="page-resource-title" className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <FileText className="size-3 text-emerald-400" /> Resource Title
            </label>
            <input id="page-resource-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              placeholder="e.g. Full Stack Web Dev Roadmap"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="page-external-link" className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Globe className="size-3 text-emerald-400" /> External Link
            </label>
            <input id="page-external-link"
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
              <label htmlFor="page-category" className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Info className="size-3 text-emerald-400" /> Category
              </label>
              <select id="page-category"
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
              <label htmlFor="page-related-event-optional" className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Link2 className="size-3 text-emerald-400" /> Related Event (Optional)
              </label>
              <select id="page-related-event-optional"
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
            <label htmlFor="page-description" className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Description
            </label>
            <textarea id="page-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none"
              placeholder="Briefly describe what this resource is about&hellip;"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="size-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
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
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Resource
          </Button>
        </div>
      </form>
    </div>
  );
}

