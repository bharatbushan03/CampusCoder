'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  ChevronRight,
  MessageSquare,
  CalendarDays,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { AnimatedSection } from '@/components/animations/ScrollAnimations';
import { api } from '@/lib/api';
import { EVENT_DATE_LABEL, EVENT_DEADLINE_LABEL, EVENT_TIME_LABEL } from '@/lib/eventSchedule';
import { EventPhotoLightbox } from '@/components/events/EventPhotoLightbox';
import { getEventPhotos } from '@/lib/eventPhotos';

type EventRow = {
  id: string;
  title: string;
  slug: string;
  short_description?: string | null;
  event_type: string;
  status: string;
  mode: string;
  date: string;
  registration_deadline?: string | null;
  photos?: string[] | null;
};

const eventTypeOptions = [
  { value: 'all', label: 'All types' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'coding_session', label: 'Coding Sessions' },
  { value: 'challenge', label: 'Challenges' },
  { value: 'webinar', label: 'Webinars' },
  { value: 'orientation', label: 'Orientations' },
] as const;

const statusOptions = [
  { value: 'all', label: 'All status' },
  { value: 'published', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

const modeOptions = [
  { value: 'all', label: 'All modes' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;

function getStatusVariant(status: string): 'accent' | 'success' | 'warning' | 'default' {
  switch (status) {
    case 'published': return 'accent';
    case 'completed': return 'success';
    case 'cancelled': return 'warning';
    default: return 'default';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'published': return 'Upcoming';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

function SelectFilter({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/40 appearance-none cursor-pointer min-w-0"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export default function EventsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [activeGalleryEvent, setActiveGalleryEvent] = useState<{ title: string; photos: string[] } | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await api<{ ok: boolean; events: EventRow[] }>('/events');
        setEvents(data.events || []);
      } catch (err) {
        console.warn('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };
    void loadEvents();
  }, []);

  const featuredEvent = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events.find(
      ev => ev.status === 'published' && new Date(ev.date) >= today
    );
  }, [events]);

  const filteredEvents = useMemo(() => {
    let list = events;

    if (featuredEvent) {
      list = list.filter(ev => ev.id !== featuredEvent.id);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(ev =>
        ev.title.toLowerCase().includes(q) ||
        (ev.short_description || '').toLowerCase().includes(q)
      );
    }

    if (typeFilter !== 'all') {
      list = list.filter(ev => ev.event_type === typeFilter);
    }

    if (statusFilter !== 'all') {
      list = list.filter(ev => ev.status === statusFilter);
    }

    if (modeFilter !== 'all') {
      list = list.filter(ev => ev.mode === modeFilter);
    }

    return list;
  }, [events, searchQuery, typeFilter, statusFilter, modeFilter, featuredEvent]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-10 md:space-y-14">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-800/60 animate-pulse rounded-lg" />
          <div className="h-4 w-96 bg-slate-800/60 animate-pulse rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          <SkeletonCard count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-10 md:space-y-14">
        {/* ── HEADER ── */}
        <AnimatedSection className="flex flex-col sm:flex-row sm:items-end justify-between gap-4" direction="up">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-50 tracking-tight">
              Events & Workshops
            </h1>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Find upcoming coding sessions, workshops, and challenges organized by the CampusCoder community.
            </p>
          </div>
          <Link
            href="/events/archive"
            className="text-xs text-slate-500 hover:text-emerald-400 transition-colors shrink-0 flex items-center gap-1"
          >
            Past archive <ChevronRight className="size-3" />
          </Link>
        </AnimatedSection>

        {/* ── FEATURED EVENT ── */}
        {featuredEvent && (
          <AnimatedSection delay={0.05}>
            <Card hoverEffect className="p-0 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/5 bg-emerald-900/10 p-8 md:p-10 flex flex-col justify-center items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-slate-800/60">
                  <Badge variant="accent" className="mb-4">Next event</Badge>
                  <div className="text-5xl md:text-6xl font-bold text-emerald-400 leading-none">
                    {EVENT_DATE_LABEL}
                  </div>
                  <div className="text-base text-slate-400 mt-1">
                    {EVENT_TIME_LABEL}
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
                    <Clock className="size-3.5" />
                    {EVENT_TIME_LABEL}
                  </div>
                </div>
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                  <Badge variant="default" className="mb-3 w-fit">
                    {featuredEvent.event_type.replace('_', ' ')}
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-50 leading-tight">
                    {featuredEvent.title}
                  </h2>
                  {featuredEvent.short_description && (
                    <p className="text-sm text-slate-400 mt-3 leading-relaxed line-clamp-2">
                      {featuredEvent.short_description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {featuredEvent.mode}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      {EVENT_DATE_LABEL}
                    </span>
                    {featuredEvent.registration_deadline && (
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="size-3.5" />
                        Register by {EVENT_DEADLINE_LABEL}
                      </span>
                    )}
                  </div>
                  <div className="mt-6">
                    <Link href={`/events/${featuredEvent.slug}`}>
                      <Button variant="primary" size="md">
                        Register now <ChevronRight className="ml-1 size-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </AnimatedSection>
        )}

        {/* ── FILTER BAR ── */}
        <AnimatedSection delay={0.1}>
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <SelectFilter
                options={eventTypeOptions}
                value={typeFilter}
                onChange={setTypeFilter}
                label="Filter by event type"
              />
              <SelectFilter
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                label="Filter by status"
              />
              <SelectFilter
                options={modeOptions}
                value={modeFilter}
                onChange={setModeFilter}
                label="Filter by mode"
              />
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input
                aria-label="Search events"
                type="text"
                placeholder="Search events…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
              />
            </div>
          </div>
        </AnimatedSection>

        {/* ── EVENT GRID ── */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filteredEvents.map((ev, index) => (
              <AnimatedSection key={ev.id} delay={index * 0.05} className="h-full">
                <Card hoverEffect className="p-0 overflow-hidden h-full flex flex-col">
                  {/* Top accent bar based on status */}
                  <div className={`h-1 shrink-0 ${
                    ev.status === 'published' ? 'bg-emerald-500/60' :
                    ev.status === 'completed' ? 'bg-slate-600/40' :
                    'bg-red-500/40'
                  }`} />

                  <div className="p-5 md:p-6 flex flex-col flex-1 gap-4">
                    {/* Badge row */}
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="default">
                        {ev.event_type.replace('_', ' ')}
                      </Badge>
                      <Badge variant={getStatusVariant(ev.status)}>
                        {getStatusLabel(ev.status)}
                      </Badge>
                    </div>

                    {/* Date block */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <CalendarDays className="size-4 text-slate-600 shrink-0" />
                      <span className="font-medium text-slate-300">{EVENT_DATE_LABEL}</span>
                    </div>

                    {/* Title + Description */}
                    <div className="space-y-2 flex-1">
                      <h3 className="text-base font-semibold text-slate-50 leading-snug">
                        <Link href={`/events/${ev.slug}`} className="hover:text-emerald-400 transition-colors">
                          {ev.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {ev.short_description || 'No description available.'}
                      </p>
                    </div>

                    {/* Meta row */}
                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-slate-600" />
                        {EVENT_TIME_LABEL}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-slate-600" />
                        {ev.mode}
                      </div>
                      {ev.registration_deadline && (
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="size-3.5 text-slate-600" />
                          Register by {EVENT_DEADLINE_LABEL}
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="pt-3 border-t border-slate-800/60 mt-auto flex items-center gap-2">
                      <Link href={`/events/${ev.slug}`} className="flex-1">
                        <Button
                          variant={ev.status === 'published' ? 'primary' : 'outline'}
                          size="sm"
                          className="w-full text-xs font-mono"
                        >
                          {ev.status === 'published' ? 'Register now' : 'View details'}
                        </Button>
                      </Link>

                      {(() => {
                        const eventPhotos = getEventPhotos(ev.photos, ev.event_type, ev.slug || ev.title);
                        if (eventPhotos.length === 0) return null;
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveGalleryEvent({
                                title: ev.title,
                                photos: eventPhotos,
                              });
                            }}
                            className="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                            title="View Event Photos & Gallery"
                          >
                            <Camera className="size-3.5 text-emerald-400" />
                            <span className="hidden sm:inline">Photos</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <AnimatedSection>
            <Card glass={false} className="p-12 md:p-16 text-center">
              <div className="max-w-sm mx-auto space-y-4">
                <Calendar className="size-10 text-slate-700 mx-auto" />
                <h3 className="text-lg font-semibold text-slate-300">
                  {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || modeFilter !== 'all'
                    ? 'No events match your filters'
                    : 'No events yet'}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || modeFilter !== 'all'
                    ? 'Try different filters or search terms.'
                    : 'No events scheduled yet. Join the community to know when the next one is live.'}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || modeFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setTypeFilter('all');
                        setStatusFilter('all');
                        setModeFilter('all');
                      }}
                    >
                      Reset filters
                    </Button>
                  )}
                  <a
                    href="https://discord.gg/VdsX64E5E"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="secondary" size="sm">
                      <MessageSquare className="mr-1.5 size-3.5" />
                      Join Discord
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          </AnimatedSection>
        )}

        {/* ── BOTTOM COMMUNITY CTA ── */}
        <AnimatedSection className="text-center py-10 md:py-14 border-t border-slate-800/40" delay={0.15}>
          <p className="text-xs text-slate-500 mb-3">Hear about new events first</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://discord.gg/VdsX64E5E"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="md">
                <MessageSquare className="mr-2 size-4" />
                Join Discord
              </Button>
            </a>
          </div>
        </AnimatedSection>
      </div>

      {/* Online Photo Lightbox Modal */}
      {activeGalleryEvent && (
        <EventPhotoLightbox
          photos={activeGalleryEvent.photos}
          eventTitle={activeGalleryEvent.title}
          isOpen={!!activeGalleryEvent}
          onClose={() => setActiveGalleryEvent(null)}
        />
      )}
    </div>
  );
}

