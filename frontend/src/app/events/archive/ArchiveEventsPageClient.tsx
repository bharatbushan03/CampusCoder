'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft,
  Users,
  Video,
  Search,
  Layers,
  ArrowRight,
  Camera,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';

import { CampusCoderLoader } from '@/components/ui/CampusCoderLoader';
import { ZipPhotoViewer } from '@/components/events/ZipPhotoViewer';
import { getEventPhotos } from '@/lib/eventPhotos';

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
  registrations_count?: number;
  photos?: string[] | null;
  photos_zip_url?: string | null;
  photos_drive_url?: string | null;
};

const generateEventSlug = (title: string | undefined | null, id: string | undefined | null): string => {
  // If we have a title, try to create a slug from it
  if (title && typeof title === 'string') {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      || `event-${id || 'unknown'}`;
  }
  // Fallback to ID-based slug
  return `event-${id || 'unknown'}`;
};

export default function EventArchivePage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeGalleryEvent, setActiveGalleryEvent] = useState<{
    title: string;
    photos: string[];
    photosZipUrl?: string | null;
    photosDriveUrl?: string | null;
  } | null>(null);

  useEffect(() => {
    const loadArchive = async () => {
      try {
        const data = await api<{ ok: boolean; events: EventRow[] }>('/events/archive');
        setEvents(data.events || []);
      } catch (err) {
        console.warn('Failed to load archive:', err);
      } finally {
        setLoading(false);
      }
    };
     
    void loadArchive();
  }, []);

  const filteredEvents = events.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter ? ev.event_type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <CampusCoderLoader fullPage text="Loading event archive" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-2">
        <Link href="/events" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
          <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Events
        </Link>
        <h1 className="text-4xl font-extrabold text-white tracking-tight font-mono">Event <span className="text-emerald-500">Archive</span></h1>
        <p className="text-slate-400 max-w-2xl">Past events with recordings, slides, and project resources.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input aria-label="Search past events"
            type="text"
            placeholder="Search past events&hellip;"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50"
        >
          <option value="">All Types</option>
          <option value="workshop">Workshops</option>
          <option value="coding_session">Coding Sprints</option>
          <option value="webinar">Webinars</option>
        </select>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => (
            <Card key={ev.id} className="group overflow-hidden flex flex-col h-full border-slate-800 bg-slate-950/40">
              <div className="relative aspect-video overflow-hidden border-b border-slate-900">
                {ev.banner_url ? (
                  <Image
                    src={ev.banner_url} 
                    alt={ev.title} 
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-60 group-hover:opacity-100" 
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <Layers className="size-10 text-slate-800" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-950/80 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
                    {(ev.event_type || 'unknown').replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="p-5 gap-y-4 flex-1 flex flex-col">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500">{ev.date ? ev.date : 'TBC'}</p>
                  <h3 className="text-lg font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors">{ev.title || 'Untitled Event'}</h3>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed flex-1">
                  {ev.summary || ev.short_description || "No description available."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-900">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                      <Users className="size-3 text-emerald-500/50" /> {ev.registrations_count || 0} RSVPs
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const eventPhotos = getEventPhotos(ev.photos, ev.event_type, ev.slug || ev.title);
                      if (eventPhotos.length === 0 && !ev.photos_zip_url && !ev.photos_drive_url) return null;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveGalleryEvent({
                              title: ev.title,
                              photos: eventPhotos,
                              photosZipUrl: ev.photos_zip_url,
                              photosDriveUrl: ev.photos_drive_url,
                            });
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors flex items-center gap-1 cursor-pointer"
                          title="View Event Photos & Gallery"
                        >
                          <Camera className="size-3.5 text-emerald-400" />
                          <span className="text-[10px] font-mono hidden sm:inline">
                            {ev.photos_zip_url ? 'Photos (.zip)' : 'Photos'}
                          </span>
                        </button>
                      );
                    })()}

                    {ev.recording_url && (
                      <a href={ev.recording_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Watch Recording">
                        <Video className="size-3.5" />
                      </a>
                    )}
                    <Link href={`/events/${ev.slug || generateEventSlug(ev.title, ev.id)}`}>
                      <button type="button" className="text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group/btn">
                        Details <ArrowRight className="size-3 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-800 rounded-3xl">
          <p className="text-slate-500 font-mono">No past events match your search.</p>
        </div>
      )}

      {/* Online Photo / ZIP Viewer Modal */}
      {activeGalleryEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl my-auto py-8">
            <button
              onClick={() => setActiveGalleryEvent(null)}
              className="absolute top-0 right-0 p-2.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-all cursor-pointer z-50"
              title="Close"
            >
              <X className="size-5" />
            </button>
            <ZipPhotoViewer
              photos={activeGalleryEvent.photos}
              photosZipUrl={activeGalleryEvent.photosZipUrl}
              photosDriveUrl={activeGalleryEvent.photosDriveUrl}
              eventTitle={activeGalleryEvent.title}
            />
          </div>
        </div>
      )}
    </div>
  );
}

