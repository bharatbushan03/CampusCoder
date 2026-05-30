'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, Clock, MapPin, Search, 
  Filter, Layers, ArrowRight, Sparkles,
  ChevronRight, LayoutGrid, List
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';

export default function EventsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveCategory] = useState('all');

  const eventTypes = [
    { id: 'all', label: 'All Sprints' },
    { id: 'workshop', label: 'Workshops' },
    { id: 'coding_session', label: 'Coding' },
    { id: 'challenge', label: 'Challenges' },
  ];

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .in('status', ['published', 'completed', 'cancelled'])
          .order('date', { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.warn('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const filteredEvents = events.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeType === 'all' ? true : ev.event_type === activeType;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12 min-h-screen">
        <div className="space-y-4 max-w-xl">
          <div className="h-8 w-48 skeleton"></div>
          <div className="h-12 w-96 skeleton"></div>
          <div className="h-4 w-full skeleton"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-96 skeleton rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> Live Sprints
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight font-mono">
              Build your <span className="text-emerald-500 underline decoration-emerald-500/20 underline-offset-8">stack.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Hands-on sessions designed to bridge the gap between classroom theory and industry reality.
            </p>
          </div>
        </div>
        
        <Link href="/events/archive">
          <Button variant="outline" className="group h-12 px-6">
            View Past Archive <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-2 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm">
        <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-900/50 w-full md:w-auto">
          {eventTypes.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-tighter transition-all ${
                activeType === cat.id 
                  ? 'bg-emerald-500 text-emerald-950' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filter sprints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/30 transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {filteredEvents.map((ev) => (
            <Card key={ev.id} className="group flex flex-col h-full border-slate-800/60 bg-slate-950 overflow-hidden hover:border-emerald-500/30 transition-all duration-500">
              <div className="aspect-video relative overflow-hidden border-b border-slate-900">
                {ev.banner_url ? (
                  <Image
                    src={ev.banner_url} 
                    alt={ev.title} 
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" 
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <Layers className="h-10 w-10 text-slate-800" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-950/90 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest backdrop-blur-md">
                    {ev.event_type.replace('_', ' ')}
                  </span>
                </div>
                {ev.status !== 'published' && (
                  <div className="absolute top-4 right-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border uppercase tracking-widest backdrop-blur-md ${
                      ev.status === 'cancelled'
                        ? 'bg-red-950/90 text-red-300 border-red-500/30'
                        : 'bg-slate-950/90 text-slate-300 border-slate-700'
                    }`}>
                      {ev.status}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-8 flex-1 flex flex-col space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-widest opacity-80">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(ev.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {ev.start_time.slice(0,5)}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors">
                    {ev.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                    {ev.short_description || "Master real-world tech through intensive peer-led building sessions."}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-900/50 mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                    <MapPin className="h-3 w-3 text-emerald-500/50" /> {ev.mode}
                  </div>
                  <Link href={`/events/${ev.slug}`}>
                    <Button variant="primary" size="sm" className="font-bold shadow-lg shadow-emerald-500/10">
                      {ev.status === 'published' ? 'Reserve RSVP' : 'View Details'}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-slate-900/10 border border-dashed border-slate-800 rounded-3xl space-y-4">
          <Layers className="h-12 w-12 text-slate-800 mx-auto" />
          <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">No matching sprints found</p>
          <Button variant="outline" size="sm" onClick={() => {setActiveCategory('all'); setSearchQuery('');}}>
            Reset Filters
          </Button>
        </div>
      )}

      {/* Newsletter / CTA */}
      <section className="py-20 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white font-mono uppercase tracking-tighter">
            Don&apos;t miss the <span className="text-emerald-500">next drop.</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto font-medium">
            New sprints are announced weekly. Join our Discord to get notifications before registration reaches capacity.
          </p>
          <div className="flex justify-center">
            <Link href="https://discord.gg/campuscoder">
              <Button variant="secondary" size="lg" className="h-14 px-10">
                Join Community Discord
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      </section>
    </div>
  );
}
