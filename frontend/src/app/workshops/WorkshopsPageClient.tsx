'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft,
  Terminal,
  Video,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { EVENT_DATE_LABEL } from '@/lib/eventSchedule';
import { AnimatedSection, AnimatedCard } from '@/components/animations/ScrollAnimations';

type EventRow = {
  id: string;
  title: string;
  slug: string;
  short_description?: string | null;
  summary?: string | null;
  event_type: string;
  status: string;
  date: string;
  banner_url?: string | null;
  recording_url?: string | null;
};

export default function WorkshopsPage() {
  const [loading, setLoading] = useState(true);
  const [workshops, setWorkshops] = useState<EventRow[]>([]);

  useEffect(() => {
    const loadWorkshops = async () => {
      try {
        const data = await api<{ ok: boolean; workshops: EventRow[] }>('/events/workshops');
        setWorkshops(data.workshops || []);
      } catch (err) {
        console.warn('Failed to load workshops:', err);
      } finally {
        setLoading(false);
      }
    };
     
    void loadWorkshops();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-slate-800/60 animate-pulse rounded-lg" />
          <div className="flex items-center gap-3">
            <Skeleton variant="avatar" className="size-12" />
            <Skeleton variant="text" className="h-8 w-72" />
          </div>
          <Skeleton variant="text" className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-800/60 bg-slate-900/50 overflow-hidden">
              <Skeleton variant="card" className="h-48 md:h-auto rounded-none" />
              <div className="p-6 space-y-3">
                <Skeleton variant="text" className="h-4 w-20" />
                <Skeleton variant="text" className="h-6 w-3/4" />
                <Skeleton variant="text" className="h-4 w-full" />
                <Skeleton variant="text" className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <AnimatedSection className="space-y-4" direction="up">
        <Link href="/events" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
          <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Events
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles className="size-6 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight font-mono">Technical <span className="text-emerald-500">Workshops</span></h1>
        </div>
        <p className="text-slate-400 max-w-2xl text-lg">Hands-on sessions led by seniors and mentors. Build real projects and learn by doing.</p>
      </AnimatedSection>

      {workshops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {workshops.map((ws, index) => (
            <AnimatedCard key={ws.id} delay={index * 0.1}>
              <Card className="group overflow-hidden flex flex-col md:flex-row border-slate-800 bg-slate-950/40 hover:border-emerald-500/30 transition-all p-0 h-full">
                <div className="md:w-48 h-48 md:h-auto relative overflow-hidden flex-shrink-0">
                  {ws.banner_url ? (
                    <Image
                      src={ws.banner_url} 
                      alt={ws.title} 
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 192px"
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                      <Terminal className="size-12 text-slate-800" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent md:hidden"></div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between gap-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-widest ${
                        ws.status === 'published' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}>
                        {ws.status === 'published' ? 'Upcoming' : 'Archived'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{EVENT_DATE_LABEL}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{ws.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {ws.short_description || ws.summary || "Deep dive into technical concepts with expert guidance."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-900">
                    <div className="flex items-center gap-2">
                      {ws.recording_url && (
                        <a href={ws.recording_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                          <Video className="size-4" />
                        </a>
                      )}
                    </div>
                    <Link href={`/events/${ws.slug}`}>
                      <Button variant="outline" size="sm" className="h-10 text-sm font-mono group/btn">
                        Watch Recording <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </AnimatedCard>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-800 rounded-3xl space-y-4">
          <Layers className="size-12 text-slate-800 mx-auto" />
          <p className="text-slate-500 font-mono">No workshops scheduled right now.</p>
          <Link href="/events">
            <Button variant="primary">Browse all events</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

