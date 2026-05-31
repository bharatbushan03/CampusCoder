'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  User,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertOctagon,
  AlertTriangle,
  Link2,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { placeholderEvents } from '@/lib/placeholderData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';
import type { CodingEvent } from '@/types';

type EventRow = Database['public']['Tables']['events']['Row'];
type EventOwnerRow = Database['public']['Tables']['event_owners']['Row'];
type CommunityLinkRow = Database['public']['Tables']['community_links']['Row'];
type SupabaseEvent = EventRow & Partial<CodingEvent> & { event_owners: EventOwnerRow[] | null };
type PlaceholderEvent = CodingEvent & Partial<EventRow> & { event_owners?: EventOwnerRow[] | null };
type EventData = SupabaseEvent | PlaceholderEvent;
type RelatedEvent = (EventRow & Partial<CodingEvent>) | PlaceholderEvent;
type CommunityLinkItem = Pick<CommunityLinkRow, 'platform' | 'url' | 'is_active'> & { id?: string };

function getSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function EventDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [event, setEvent] = useState<EventData | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<RelatedEvent[]>([]);
  const [communityLinks, setCommunityLinks] = useState<CommunityLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not_found' | 'unauthorized' | null>(null);

  useEffect(() => {
    async function fetchEventDetails() {
      if (!slug) return;
      try {
        const supabase = createClient();
        
        // 1. Fetch Event by Slug
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            event_owners (*)
          `)
          .eq('slug', slug)
          .in('status', ['published', 'completed', 'cancelled'])
          .single()
          .returns<SupabaseEvent>();

        if (eventError) throw eventError;

        setEvent(eventData);

        // 2. Fetch Related Events
        const { data: relatedData } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .neq('slug', slug)
          .limit(2)
          .returns<EventRow[]>();

        if (relatedData) {
          setRelatedEvents(relatedData);
        }

        // 3. Fetch Active Community Links
        const { data: linksData } = await supabase
          .from('community_links')
          .select('*')
          .eq('is_active', true)
          .returns<CommunityLinkRow[]>();

        if (linksData) {
          setCommunityLinks(linksData);
        }
      } catch (err) {
        const errorCode =
          err && typeof err === 'object' && 'code' in err
            ? (err as { code?: string }).code
            : undefined;
        if (errorCode === 'PGRST116') {
          setError('not_found');
          setLoading(false);
          return;
        }

        console.warn('Supabase fetch failed, looking up in local placeholders:', err);
        
        // Local fallback lookup
        const localMatch = placeholderEvents.find((ev) => getSlug(ev.title) === slug);
        
        if (localMatch) {
          setEvent(localMatch);
          // Load local related events
          const localRelated = placeholderEvents
            .filter((ev) => getSlug(ev.title) !== slug)
            .slice(0, 2);
          setRelatedEvents(localRelated);
        } else {
          setError('not_found');
        }

        // Load static community links
        setCommunityLinks([
          { platform: 'Discord', url: '#', is_active: true },
          { platform: 'Slack Channel', url: '#', is_active: true },
          { platform: 'GitHub Team', url: '#', is_active: true }
        ]);
      } finally {
        setLoading(false);
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchEventDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="tech-grid min-h-screen flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="size-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-400">Loading sprint parameters&hellip;</p>
        </div>
      </div>
    );
  }

  // Draft / Unauthorized view
  if (error === 'unauthorized') {
    return (
      <div className="tech-grid min-h-screen flex items-center justify-center py-20 px-4">
        <Card className="text-center max-w-md p-8 border-amber-500/20 bg-slate-950">
          <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 mx-auto mb-4">
            <AlertOctagon className="size-6 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 text-xs mb-6 leading-relaxed">
            This event is currently in a draft state and has not been published for general access yet.
          </p>
          <Link href="/events">
            <Button variant="primary" size="sm">Return to Events</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Not found view
  if (error === 'not_found' || !event) {
    return (
      <div className="tech-grid min-h-screen flex items-center justify-center py-20 px-4">
        <Card className="text-center max-w-md p-8 border-red-500/20 bg-slate-950">
          <h2 className="text-2xl font-bold text-white mb-2">Sprint Not Found</h2>
          <p className="text-slate-400 text-xs mb-6 leading-relaxed">
            The requested sprint slug could not be located in our active schedules.
          </p>
          <Link href="/events">
            <Button variant="primary">Return to Events</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Enforcements Checks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.date);
  
  const isCompleted = event.status === 'completed' || eventDate < today;
  const isCancelled = event.status === 'cancelled';
  
  // Registration deadline check
  let isDeadlinePassed = false;
  if (event.registration_deadline) {
    isDeadlinePassed = new Date(event.registration_deadline) < new Date();
  } else if (eventDate < today) {
    isDeadlinePassed = true;
  }

  const isRegistrationDisabled = isDeadlinePassed || isCompleted || isCancelled;

  // Speaker Fallback mapping
  const speaker = event.event_owners?.[0] || event.speaker || {
    name: 'CampusCoder Tech Panel',
    role: 'Industry Mentors',
    bio: 'Seniors and industry mentors volunteering to build coding competencies and bridge knowledge gaps on campus.'
  };

  const totalSeats = event.seatsTotal || event.seats_total || 100;
  const registered = event.seatsRegistered || event.seats_registered || 0;
  const remainingSeats = totalSeats - registered;
  const fillPercentage = Math.round((registered / totalSeats) * 100);
  const eventType = event.event_type || event.type || 'workshop';

  return (
    <div className="tech-grid min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link href="/events" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors mb-8 group">
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" /> Back to all events
        </Link>

        {/* Dynamic Cancelled Banner */}
        {isCancelled && (
          <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-500/30 rounded-xl mb-8 text-sm text-red-400">
            <AlertOctagon className="size-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-bold">This session has been cancelled</p>
              <p className="text-xs text-red-400/80">Please check other upcoming developer sprints in the catalogue.</p>
            </div>
          </div>
        )}

        {isCompleted && !isCancelled && (
          <div className="flex items-center gap-3 p-4 bg-slate-900/80 border border-slate-700 rounded-xl mb-8 text-sm text-slate-300">
            <CheckCircle className="size-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-bold">This session has been completed</p>
              <p className="text-xs text-slate-400">Registration is closed, but the details remain available for reference.</p>
            </div>
          </div>
        )}

        {/* Layout split: Main content vs Registration sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Event Content card */}
            <Card hoverEffect={false} className="p-8">
              {event.banner_url && (
                <div className="relative mb-8 aspect-video overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                  <Image
                    src={event.banner_url}
                    alt={`${event.title} banner`}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 768px"
                  />
                </div>
              )}

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 capitalize mb-4 inline-block">
                {eventType.replace('_', ' ')}
              </span>

              <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-2 mb-4 leading-tight">
                {event.title}
              </h1>

              {/* Event Metadata row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 py-4 border-y border-slate-900">
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Calendar className="size-4.5 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Date</p>
                    <p className="font-medium">{new Date(event.date).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Clock className="size-4.5 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Time</p>
                    <p className="font-medium">{event.start_time ? `${event.start_time.slice(0,5)} - ${event.end_time.slice(0,5)}` : event.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <MapPin className="size-4.5 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Location / Mode</p>
                    <p className="font-medium truncate max-w-[180px] capitalize">{event.location || event.mode}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-invert max-w-none space-y-4">
                <h3 className="text-lg font-bold text-white mb-2 font-mono">About session</h3>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {event.full_description || event.longDescription || event.short_description || event.description}
                </p>
              </div>

              {/* Event Tags */}
              <div className="mt-8 flex flex-wrap gap-2">
                {(event.tags || ['Coding', 'Tech']).map((tag: string) => (
                  <span key={tag} className="text-xs font-mono bg-slate-950/80 text-emerald-400/80 border border-slate-850 px-3 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </Card>

            {/* Speaker Information */}
            <Card hoverEffect={false} className="p-8">
              <h3 className="text-lg font-bold text-white mb-6 font-mono">Speaker Panel</h3>
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <User className="size-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{speaker.name}</h4>
                  <p className="text-xs text-emerald-400 font-mono mb-2">{speaker.role}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {speaker.bio || 'Seniors and industry mentors volunteering to build coding competencies and bridge knowledge gaps on campus.'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Meeting link notice */}
            {event.meeting_link && (event.mode === 'online' || event.mode === 'hybrid') && (
              <Card hoverEffect={false} className="p-8 border-emerald-500/20 bg-slate-900/40">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Link2 className="size-5 text-emerald-400" /> Meeting Details
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This is a virtual event. The private meeting link is shared directly with registered students by email and community channels.
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar drawer: RSVP & community links */}
          <div className="space-y-6">
            
            {/* RSVP drawer card */}
            <Card hoverEffect={false} className={`border-emerald-500/20 bg-slate-900 p-6 ${isRegistrationDisabled ? 'opacity-90' : ''}`}>
              <h3 className="text-lg font-bold text-white mb-4 font-mono">Registration</h3>
              
              {/* Registration seats progress */}
              {!isCancelled && !isCompleted && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>Available Seats</span>
                    <span className="font-semibold text-emerald-400">
                      {remainingSeats} of {totalSeats} left
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${fillPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Status information banners */}
              {isCancelled ? (
                <div className="bg-red-500/5 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-6 text-center font-mono">
                  RSVPs CANCELLED
                </div>
              ) : isCompleted ? (
                <div className="bg-slate-950 border border-slate-850 text-slate-400 text-xs p-3 rounded-lg mb-6 text-center font-mono">
                  SESSION COMPLETED
                </div>
              ) : isDeadlinePassed ? (
                <div className="bg-amber-500/5 border border-amber-500/20 text-amber-400 text-xs p-3 rounded-lg mb-6 text-center font-mono">
                  DEADLINE PASSED
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle className="size-4 text-emerald-400" />
                    <span>Free entry for campus students</span>
                  </div>
                  {event.registration_deadline && (
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <AlertTriangle className="size-4 text-amber-500" />
                      <span>RSVP by: {new Date(event.registration_deadline).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action register button */}
              <Link href={isRegistrationDisabled ? '#' : `/events/${slug}/register`} className="block">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isRegistrationDisabled}
                >
                  {isCancelled ? (
                    'Cancelled'
                  ) : isCompleted ? (
                    'Sprints Finished'
                  ) : isDeadlinePassed ? (
                    'Registrations Closed'
                  ) : (
                    <>
                      Register for Event <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </Link>
            </Card>

            {/* Community Links card */}
            <Card hoverEffect={false} className="p-6">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <MessageSquare className="size-4 text-emerald-400" /> Join Channels
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Connect with our active channels to get updates, slides, code repositories, and notifications.
              </p>
              <div className="space-y-2">
                {communityLinks.length > 0 ? communityLinks.map((link) => (
                  <a
                    key={link.id ?? link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-xs text-slate-300 hover:text-emerald-400 p-2.5 rounded bg-slate-950/60 border border-slate-900 transition-colors group"
                  >
                    <span className="capitalize">{link.platform}</span>
                    <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )) : (
                  <p className="text-[10px] text-slate-500 font-mono italic">No channels linked yet.</p>
                )}
              </div>
            </Card>
          </div>

        </div>

        {/* 13. Related Upcoming Events Section */}
        {relatedEvents.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-900/80">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2 font-mono">
              <Sparkles className="size-5 text-emerald-400" /> Other Upcoming Sprints
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedEvents.map((rel) => {
                const relType = rel.event_type || rel.type || 'workshop';
                const relSlug = rel.slug || getSlug(rel.title);
                return (
                  <Card key={rel.id} className="flex flex-col justify-between h-full group hover:border-emerald-500/20">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 capitalize inline-block mb-3">
                        {relType.replace('_', ' ')}
                      </span>
                      <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">
                        {rel.title}
                      </h4>
                      <p className="text-xs text-slate-400 mb-6 line-clamp-2">
                        {rel.short_description || rel.description}
                      </p>
                    </div>
                    <Link href={`/events/${relSlug}`} className="block">
                      <Button variant="secondary" size="sm" className="w-full justify-between">
                        View Details <ArrowRight className="size-3.5" />
                      </Button>
                    </Link>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
