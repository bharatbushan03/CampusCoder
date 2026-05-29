'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Globe, FileText, Link2, Info } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { resourceSchema } from '@/lib/validation';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditResourcePage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    link: '',
    category: 'roadmaps' as any,
    event_id: '',
    is_active: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient() as any;
        
        const [resRes, eventsRes] = await Promise.all([
          supabase.from('resources').select('*').eq('id', id).single(),
          supabase.from('events').select('id, title').order('date', { ascending: false })
        ]);

        if (resRes.error) throw resRes.error;
        const res = resRes.data;
        setForm({
          title: res.title,
          description: res.description || '',
          link: res.link,
          category: res.category,
          event_id: res.event_id || '',
          is_active: res.is_active
        });
        setEvents(eventsRes.data || []);
      } catch (err: any) {
        toast.error('Error loading resource');
        router.push('/admin/resources');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

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
      const supabase = createClient() as any;
      const { error } = await supabase.from('resources').update(payload).eq('id', id);
      if (error) throw error;
      toast.success('Changes saved');
      router.push('/admin/resources');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-screen">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <Link href="/admin/resources" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Library
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">Edit <span className="text-emerald-500">Resource</span></h1>
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
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
