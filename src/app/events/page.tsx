'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  User,
  AlertTriangle,
  Code,
  CheckCircle,
  Video,
  Award,
  BookOpen,
  HelpCircle,
  Laptop
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';
import { placeholderEvents } from '@/lib/placeholderData';

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'completed'>('upcoming');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { label: 'All Sprints', value: 'all', icon: Laptop },
    { label: 'Workshops', value: 'workshop', icon: BookOpen },
    { label: 'Coding Sessions', value: 'coding_session', icon: Code },
    { label: 'Challenges', value: 'challenge', icon: Award },
    { label: 'Webinars', value: 'webinar', icon: Video },
  ];

  useEffect(() => {
    async function fetchEvents() {
      try {
        const supabase = createClient() as any;
        
        // Fetch all events that are not drafts
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            event_owners (*)
          `)
          .in('status', ['published', 'completed', 'cancelled'])
          .order('date', { ascending: true });

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase-project')) {
            setEvents(placeholderEvents);
          } else {
            setEvents([]);
          }
        } else {
          setEvents(data);
        }
      } catch (err: any) {
        console.warn('Supabase fetch failed, falling back to static database:', err);
        setError(err.message || 'Database connection error.');
        // Fallback to static mock data so application is always query-ready
        setEvents(placeholderEvents);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Filter logic
  const filteredEvents = events.filter((event) => {
    // 1. Search Query Filter (Title-based)
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Event Type Filter
    const eventType = event.event_type || event.type || 'workshop';
    const matchesType = selectedType === 'all' || eventType === selectedType;

    // 3. Time Filter (Upcoming vs Completed)
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize time
    
    const isPast = eventDate < today || event.status === 'completed';
    const matchesTime = timeFilter === 'upcoming' ? !isPast : isPast;

    return matchesSearch && matchesType && matchesTime;
  });

  // Helper to determine type badges and styling
  const getTypeBadge = (type: string) => {
    const mappings: Record<string, { bg: string, text: string }> = {
      workshop: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400' },
      coding_session: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
      challenge: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
      webinar: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400' },
    };
    return mappings[type] || { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400' };
  };

  // Helper to generate dynamic CSS geometric patterns for banner placeholders
  const getBannerPattern = (id: string, type: string) => {
    const patterns: Record<string, string> = {
      workshop: 'from-blue-600/20 to-slate-950',
      coding_session: 'from-emerald-600/20 to-slate-950',
      challenge: 'from-amber-600/20 to-slate-950',
      webinar: 'from-purple-600/20 to-slate-950',
    };
    const gradient = patterns[type] || 'from-slate-800 to-slate-950';
    return `relative h-44 w-full bg-gradient-to-br ${gradient} border-b border-emerald-500/10 flex items-center justify-center overflow-hidden`;
  };

  // Loading skeleton screen
  if (loading) {
    return (
      <div className="tech-grid min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12 animate-pulse">
            <div className="h-4 w-24 bg-slate-900 rounded mb-3"></div>
            <div className="h-10 w-96 bg-slate-900 rounded mb-4"></div>
            <div className="h-4 w-full bg-slate-900 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-0 overflow-hidden border-slate-900/60 animate-pulse bg-slate-900/10">
                <div className="h-44 bg-slate-900 w-full mb-4"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 w-20 bg-slate-800 rounded"></div>
                  <div className="h-6 w-3/4 bg-slate-800 rounded"></div>
                  <div className="h-4 w-full bg-slate-800 rounded"></div>
                  <div className="h-10 w-full bg-slate-800 rounded mt-6"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tech-grid min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="max-w-3xl mb-12">
          <h1 className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">
            // Technical Hub
          </h1>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Events & Workshops
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            Enhance your computer science capabilities, build projects, optimize competitive profiles, and train for technical placements.
          </p>
        </div>

        {/* Database Warning indicator */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-slate-900 border border-emerald-500/10 rounded-xl mb-8 text-xs text-slate-400">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span>Database Connection: Offline. Displaying cached static community events.</span>
          </div>
        )}

        {/* Navigation & Search Panel */}
        <div className="space-y-6 mb-12 p-6 bg-slate-900/30 border border-slate-900 rounded-2xl backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Time Filter Tabs (Upcoming vs Completed) */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 self-start">
              <button
                onClick={() => setTimeFilter('upcoming')}
                className={`px-4 py-2 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                  timeFilter === 'upcoming'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Upcoming Sprints
              </button>
              <button
                onClick={() => setTimeFilter('completed')}
                className={`px-4 py-2 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                  timeFilter === 'completed'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Completed Archives
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search event title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Category Chips Selection */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedType === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedType(cat.value)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Event Cards Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => {
              const eventType = event.event_type || event.type || 'workshop';
              const badgeStyle = getTypeBadge(eventType);
              const speaker = event.event_owners?.[0] || event.speaker || { name: 'Campus Panel' };
              const isUpcoming = timeFilter === 'upcoming';
              const eventDateStr = new Date(event.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <Card
                  key={event.id}
                  className="p-0 overflow-hidden flex flex-col justify-between h-full group hover:border-emerald-500/30"
                >
                  <div>
                    {/* Event Banner */}
                    <div className={getBannerPattern(event.id, eventType)}>
                      {/* Banner grid overlay */}
                      <div className="absolute inset-0 tech-grid opacity-60 pointer-events-none"></div>
                      
                      {/* Mode Badge */}
                      <span className="absolute top-4 left-4 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-950/80 text-emerald-400 border border-emerald-500/20 capitalize">
                        {event.mode || 'Online'}
                      </span>

                      {/* Status Badge */}
                      <span className={`absolute top-4 right-4 text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${
                        event.status === 'completed'
                          ? 'bg-slate-900/80 text-slate-400 border-slate-800'
                          : event.status === 'cancelled'
                          ? 'bg-red-950/80 text-red-400 border-red-900/30'
                          : 'bg-emerald-950/80 text-emerald-400 border-emerald-900/30'
                      }`}>
                        {event.status || 'published'}
                      </span>

                      {/* Code Graphic overlay */}
                      <div className="font-mono text-[10px] text-slate-500/60 p-4 select-none">
                        <code>{`// compilation successful\nfunc runSprint() {\n  dev.build(type: "${eventType}")\n}`}</code>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize inline-block mb-3 ${badgeStyle.bg} ${badgeStyle.text}`}>
                        {eventType.replace('_', ' ')}
                      </span>
                      
                      <Link href={`/events/${event.id}`}>
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {event.title}
                        </h3>
                      </Link>
                      
                      <p className="text-xs text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                        {event.short_description || event.description}
                      </p>

                      {/* Detail fields */}
                      <div className="space-y-2 mb-6 border-t border-slate-900/80 pt-4">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>{eventDateStr}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          <span>{event.start_time ? `${event.start_time.slice(0,5)} - ${event.end_time.slice(0,5)}` : event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                          <span className="truncate">Lead: {speaker.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Register Call to Action */}
                  <div className="p-6 pt-0">
                    <Link href={`/events/${event.id}`} className="block">
                      <Button
                        variant={isUpcoming ? 'primary' : 'outline'}
                        className="w-full flex items-center justify-center gap-2 text-xs py-2"
                      >
                        {isUpcoming ? (
                          <>Explore & Register <ArrowRight className="h-3.5 w-3.5" /></>
                        ) : (
                          <>View Details & Recap</>
                        )}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-24 bg-slate-900/20 border border-slate-900 rounded-2xl p-8 max-w-lg mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 border border-slate-900 mx-auto mb-4">
              <HelpCircle className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Sprints Found</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">
              We couldn&apos;t find any events matching your query. Try resetting your search query or selecting a different category.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setTimeFilter('upcoming');
              }}
            >
              Reset All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
