'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertOctagon,
  AlertTriangle,
  MessageSquare,
  Phone,
  Target,
  BookOpen,
  Users,
  Code2,
  GraduationCap,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import type { CodingEvent } from '@/types';
import { AnimatedSection } from '@/components/animations/ScrollAnimations';

type EventOwnerRow = {
  id: string;
  event_id: string;
  name: string;
  role: string | null;
  email: string | null;
  bio: string | null;
  profile_image_url: string | null;
};
type EventData = {
  id: string;
  title: string;
  slug: string;
  short_description?: string | null;
  full_description?: string | null;
  summary?: string | null;
  description?: string | null;
  longDescription?: string | null;
  event_type?: string | null;
  type?: string | null;
  mode?: string | null;
  location?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  meeting_link?: string | null;
  registration_deadline?: string | null;
  status?: string | null;
  seatsTotal?: number | null;
  seatsRegistered?: number | null;
  photos?: string[] | null;
  photos_zip_url?: string | null;
  photos_drive_url?: string | null;
  event_owners?: EventOwnerRow[] | null;
  speaker?: { name: string; role?: string; bio?: string } | null;
} & Partial<CodingEvent>;
type RelatedEvent = EventData;
type CommunityLinkItem = { id?: string; platform: string; url: string; is_active?: boolean };

function getSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const learningByType: Record<string, string[]> = {
  workshop: [
    'Build projects using modern tools and frameworks',
    'Learn industry best practices and workflows',
    'Code along with live sessions',
    'Practice debugging and problem-solving',
    'Leave with a working portfolio project',
  ],
  coding_session: [
    'Solve curated problems with live walkthroughs',
    'Understand time and space complexity',
    'Recognize common interview patterns',
    'Write cleaner, efficient code with guidance',
    'Compare different solution approaches',
  ],
  challenge: [
    'Compete in challenges and track your rank',
    'Solve problems under time constraints',
    'Learn from solution discussions',
    'Build consistency with regular practice',
    'Prepare for competitive programming',
  ],
  webinar: [
    'Hear from seniors and industry professionals',
    'Learn about career paths and strategies',
    'Understand placement prep roadmaps',
    'Get your questions answered live',
  ],
  orientation: [
    'Learn about CampusCoder programs and resources',
    'Find upcoming events and how to join',
    'Understand community guidelines',
    'Connect with fellow students and mentors',
  ],
};

const whoShouldAttend: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; desc: string }[]> = {
  workshop: [
    { icon: BookOpen, label: 'Beginners', desc: 'No prior experience needed — start from scratch' },
    { icon: Code2, label: 'Intermediate developers', desc: 'Level up with real-world project building' },
    { icon: Target, label: 'Placement-focused students', desc: 'Build portfolio projects for interviews' },
  ],
  coding_session: [
    { icon: BookOpen, label: 'Beginners', desc: 'Start with basic problem patterns' },
    { icon: Code2, label: 'Intermediate', desc: 'Improve speed and accuracy' },
    { icon: Target, label: 'Placement seekers', desc: 'Master DSA for coding interviews' },
  ],
  challenge: [
    { icon: BookOpen, label: 'Beginners', desc: 'Start competing and building consistency' },
    { icon: Code2, label: 'Intermediate', desc: 'Push your ranking with harder problems' },
    { icon: Target, label: 'Competitive programmers', desc: 'Hone skills for ICPC, CodeChef, LeetCode' },
  ],
  webinar: [
    { icon: BookOpen, label: 'All students', desc: 'Learn from industry experiences' },
    { icon: Target, label: 'Placement seekers', desc: 'Get actionable career advice' },
    { icon: GraduationCap, label: 'Final year students', desc: 'Prepare for campus placements' },
  ],
  orientation: [
    { icon: Users, label: 'New members', desc: 'Learn what CampusCoder offers' },
    { icon: BookOpen, label: 'Curious students', desc: 'Explore our programs and events' },
    { icon: Target, label: 'Everyone', desc: 'Find your learning path' },
  ],
};

export default function EventDetailsPage({ initialEvent }: { initialEvent: EventData | null }) {
  // Helper to format date
  const formatEventDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Helper to format time
  const formatEventTime = (start: string, end: string) => {
    try {
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      const formatTime = (h: number, m: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
      };
      return `${formatTime(startH, startM)} – ${formatTime(endH, endM)} IST`;
    } catch {
      return `${start} – ${end}`;
    }
  };

  // Helper to format deadline
  const formatDeadline = (deadlineStr: string) => {
    try {
      const date = new Date(deadlineStr);
      return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return deadlineStr;
    }
  };

  const event = initialEvent;

  const [communityLinks, setCommunityLinks] = useState<CommunityLinkItem[]>([]);
  const [relatedEvents, setRelatedEvents] = useState<RelatedEvent[]>([]);

  useEffect(() => {
    async function fetchAdditionalData() {
      if (!event) return;
      try {
        const data = await api<{ ok: boolean; communityLinks: CommunityLinkItem[]; relatedEvents: RelatedEvent[] }>(
          `/events/slug/${event.slug}/related`
        );

        if (data.communityLinks) {
          setCommunityLinks(data.communityLinks);
        }

        if (data.relatedEvents) {
          setRelatedEvents(data.relatedEvents);
        }
      } catch (err) {
        console.warn('Failed to fetch additional data:', err);
      }
    }

    fetchAdditionalData();
  }, [event]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const eventDate = event?.date ? new Date(event.date) : null;

  const isCompleted = event?.status === 'completed' || (eventDate !== null && eventDate < today);
  const isCancelled = event?.status === 'cancelled';

  let isDeadlinePassed = false;
  if (event?.registration_deadline) {
    isDeadlinePassed = new Date(event.registration_deadline) < new Date();
  } else if (eventDate !== null && eventDate < today) {
    isDeadlinePassed = true;
  }

  const isRegistrationDisabled = isDeadlinePassed || isCompleted || isCancelled;

  const speaker = event?.event_owners?.[0] || event?.speaker || {
    name: 'CampusCoder Tech Panel',
    role: 'Industry Mentors',
    bio: 'Seniors and industry mentors volunteering to build coding competencies and bridge knowledge gaps on campus.',
  };
  const speakerBio = 'bio' in speaker ? (speaker.bio || 'Seniors and industry mentors volunteering to build coding competencies and bridge knowledge gaps on campus.') : 'Seniors and industry mentors volunteering to build coding competencies and bridge knowledge gaps on campus.';

  const eventType = (event?.event_type || event?.type || 'workshop') as string;
  const learningItems = learningByType[eventType] || learningByType.workshop;
  const attendeeGroups = whoShouldAttend[eventType] || whoShouldAttend.workshop;

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20 px-4">
        <Card glass={false} className="text-center max-w-md p-8">
          <h2 className="text-2xl font-bold text-slate-50 mb-2">Event Not Found</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            We could not find this event. It might have been removed or the link may be incorrect.
          </p>
          <Link href="/events">
            <Button variant="primary">Return to Events</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-10">

        {/* ── BACK LINK ── */}
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to all events
        </Link>

        {/* ── STATUS BANNERS ── */}
        {isCancelled && (
          <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-500/30 rounded-xl text-sm text-red-400">
            <AlertOctagon className="size-5 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold">This event has been cancelled</p>
              <p className="text-xs text-red-400/80 mt-0.5">Check other upcoming events in the catalogue.</p>
            </div>
          </div>
        )}

        {isCompleted && !isCancelled && (
          <div className="flex items-center gap-3 p-4 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-300">
            <CheckCircle className="size-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold">This event has ended</p>
              <p className="text-xs text-slate-400 mt-0.5">Registration is closed, but details are still available.</p>
            </div>
          </div>
        )}

        {/* ── HERO / EVENT SUMMARY ── */}
        <AnimatedSection direction="up">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="flex-1 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="default">
                  {eventType.replace('_', ' ')}
                </Badge>
                {isCancelled && <Badge variant="warning">Cancelled</Badge>}
                {isCompleted && !isCancelled && <Badge variant="success">Completed</Badge>}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-50 leading-tight">
                {event.title}
              </h1>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <Calendar className="size-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Date</p>
                    <p className="text-slate-300">{event?.date ? formatEventDate(event.date) : 'TBC'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="size-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Time</p>
                    <p className="text-slate-300">{event?.start_time && event?.end_time ? formatEventTime(event.start_time, event.end_time) : 'Coming soon'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="size-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Mode</p>
                    <p className="text-slate-300 capitalize">{event?.mode || event?.location || 'Online'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href={isRegistrationDisabled ? '#' : `/events/${event.slug}/register`}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto h-12 px-8"
                    disabled={isRegistrationDisabled}
                  >
                    {isCancelled ? 'Cancelled' : isCompleted ? 'Completed' : isDeadlinePassed ? 'Registrations Closed' : 'Register now'}
                    {!isRegistrationDisabled && <ArrowRight className="ml-2 size-4" />}
                  </Button>
                </Link>
                <div className="flex gap-2">
                  {communityLinks
                    .filter((l) => l.platform.toLowerCase().includes('discord'))
                    .map((l) => (
                      <a key={l.id ?? 'discord'} href={l.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="lg" className="h-12 px-6">
                          <MessageSquare className="mr-2 size-4" />
                          Join Community
                        </Button>
                      </a>
                    ))}
                </div>
              </div>
            </div>

            {/* Sidebar registration card */}
            <div className="lg:w-80 shrink-0">
              <Card hoverEffect className="p-6">
                <h3 className="text-sm font-semibold text-slate-50 mb-4">Registration</h3>

                {!isCancelled && !isCompleted && (
                  <div className="space-y-4 mb-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Seats filled</span>
                        <span className="text-emerald-400 font-medium">{Math.min(100, Math.round(((event.seatsRegistered || 0) / (event.seatsTotal || 100)) * 100))}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.round(((event.seatsRegistered || 0) / (event.seatsTotal || 100)) * 100))}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        {(event.seatsTotal || 100) - (event.seatsRegistered || 0)} of {event.seatsTotal || 100} seats remaining
                      </p>
                    </div>

                    <div className="space-y-2 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="size-3.5 text-emerald-400" />
                        <span>Free for all students</span>
                      </div>
                      {event.registration_deadline && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="size-3.5 text-amber-500" />
                          <span>Register by {formatDeadline(event.registration_deadline)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isCancelled && (
                  <div className="bg-red-500/5 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-5 text-center">
                    Registration cancelled
                  </div>
                )}
                {isCompleted && !isCancelled && (
                  <div className="bg-slate-800/50 border border-slate-700 text-slate-400 text-xs p-3 rounded-lg mb-5 text-center">
                    Event completed
                  </div>
                )}
                {isDeadlinePassed && !isCompleted && !isCancelled && (
                  <div className="bg-amber-500/5 border border-amber-500/20 text-amber-400 text-xs p-3 rounded-lg mb-5 text-center">
                    Registration deadline passed
                  </div>
                )}

                <Link href={isRegistrationDisabled ? '#' : `/events/${event.slug}/register`} className="block">
                  <Button
                    variant={isRegistrationDisabled ? 'outline' : 'primary'}
                    size="md"
                    className="w-full"
                    disabled={isRegistrationDisabled}
                  >
                    {isCancelled ? 'Cancelled' : isCompleted ? 'Completed' : isDeadlinePassed ? 'Closed' : 'Register now'}
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </AnimatedSection>

        {/* ── MAIN CONTENT + SIDEBAR ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── MAIN CONTENT ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Info panel */}
            <AnimatedSection delay={0.05}>
              <Card hoverEffect className="p-6 md:p-8">
                <h2 className="text-base font-semibold text-slate-50 mb-5">Event info</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-sm">
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium mb-0.5">Date</p>
                    <p className="text-slate-300">{event?.date ? formatEventDate(event.date) : 'TBC'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium mb-0.5">Time</p>
                    <p className="text-slate-300">{event?.start_time && event?.end_time ? formatEventTime(event.start_time, event.end_time) : 'Coming soon'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium mb-0.5">Mode</p>
                    <p className="text-slate-300 capitalize">{event?.mode || event?.location || 'Online'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium mb-0.5">Platform</p>
                    <p className="text-slate-300 capitalize">{event?.meeting_link ? 'HackerRank' : event?.location || event?.mode || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium mb-0.5">Registration deadline</p>
                    <p className="text-slate-300">{event?.registration_deadline ? formatDeadline(event.registration_deadline) : 'Expired'}</p>
                  </div>
                </div>
              </Card>
            </AnimatedSection>

            {/* Description */}
            {(event.full_description || event.longDescription || event.short_description || event.description) && (
              <AnimatedSection delay={0.08}>
                <Card hoverEffect className="p-6 md:p-8">
                  <h2 className="text-base font-semibold text-slate-50 mb-4">About this event</h2>
                  <div className="text-sm text-slate-400 leading-relaxed space-y-4 whitespace-pre-line">
                    {event.full_description || event.longDescription || event.short_description || event.description}
                  </div>
                </Card>
              </AnimatedSection>
            )}

            {/* What you will learn */}
            <AnimatedSection delay={0.1}>
              <Card hoverEffect className="p-6 md:p-8">
                <h2 className="text-base font-semibold text-slate-50 mb-4">What you will learn</h2>
                <ul className="space-y-3">
                  {learningItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                      <CheckCircle className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </AnimatedSection>

            {/* Who should attend */}
            <AnimatedSection delay={0.12}>
              <Card hoverEffect className="p-6 md:p-8">
                <h2 className="text-base font-semibold text-slate-50 mb-4">Who is this for</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {attendeeGroups.map((group) => (
                    <div key={group.label} className="rounded-lg border border-slate-800/60 bg-slate-900/30 p-4">
                      <group.icon className="size-5 text-emerald-400 mb-2" />
                      <p className="text-sm font-semibold text-slate-200">{group.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{group.desc}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </AnimatedSection>

            {/* Speakers */}
            <AnimatedSection delay={0.14}>
              <Card hoverEffect className="p-6 md:p-8">
                <h2 className="text-base font-semibold text-slate-50 mb-4">Speaker</h2>
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-emerald-400">
                      {speaker.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-50">{speaker.name}</h3>
                    <p className="text-xs text-emerald-400 mt-0.5">{speaker.role}</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {speakerBio}
                    </p>
                  </div>
                </div>
              </Card>
            </AnimatedSection>

            {/* Event Photos & Videos - Google Drive Link */}
            {event.photos_drive_url && (
              <AnimatedSection delay={0.16}>
                <Card hoverEffect className="p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-xl">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10 shrink-0">
                        <svg className="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold flex items-center gap-1">
                          <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg> Google Drive Connected
                        </span>
                        <h3 className="text-lg font-bold text-white font-mono mt-1.5">Event Photos &amp; Videos</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                          Photos and videos are hosted in Google Drive. Click below to view them directly.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
                      <a
                        href={event.photos_drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="primary"
                          size="md"
                          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer py-2.5 px-5"
                        >
                          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span>View on Google Drive</span>
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              </AnimatedSection>
            )}

          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-6">

            {/* Meeting link notice */}
            {event.meeting_link && (event.mode === 'online' || event.mode === 'hybrid') && (
              <AnimatedSection delay={0.1}>
                <Card hoverEffect className="p-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                    Meeting Details
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    This event is online. The meeting link will be shared with registered students by email and in the community.
                  </p>
                </Card>
              </AnimatedSection>
            )}

            {/* Community links */}
            <AnimatedSection delay={0.12}>
              <Card hoverEffect className="p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <MessageSquare className="size-3.5 text-emerald-400" /> Join Community
                </h4>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Get event updates, share code, and connect with other participants.
                </p>
                <div className="space-y-2">
                  {communityLinks.length > 0 ? communityLinks.map((link) => (
                    <a
                      key={link.id ?? link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-xs text-slate-300 hover:text-emerald-400 px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 transition-colors group"
                    >
                      <span className="flex items-center gap-2 capitalize">
                        {link.platform.toLowerCase().includes('discord') && <MessageSquare className="size-3.5" />}
                        {link.platform.toLowerCase().includes('whatsapp') && <Phone className="size-3.5" />}
                        {link.platform}
                      </span>
                      <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  )) : (
                    <p className="text-[10px] text-slate-600 font-mono">No channels linked yet.</p>
                  )}
                </div>
              </Card>
            </AnimatedSection>
          </div>
        </div>

        {/* ── RELATED EVENTS ── */}
        {relatedEvents.length > 0 && (
          <AnimatedSection className="pt-10 border-t border-slate-800/40" delay={0.15}>
              <h3 className="text-lg font-semibold text-slate-50 mb-6 flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-400" /> More events
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {relatedEvents.map((rel) => {
                const relType = rel.event_type || rel.type || 'workshop';
                const relSlug = rel.slug || getSlug(rel.title);
                return (
                  <Link key={rel.id} href={`/events/${relSlug}`} className="group block">
                    <Card hoverEffect className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 min-w-0">
                          <Badge variant="default">{relType.replace('_', ' ')}</Badge>
                          <h4 className="text-sm font-semibold text-slate-50 group-hover:text-emerald-400 transition-colors">
                            {rel.title}
                          </h4>
                          {rel.date && <p className="text-xs text-slate-500">{formatEventDate(rel.date)}</p>}
                        </div>
                        <ChevronRight className="size-4 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0 mt-1" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </AnimatedSection>
        )}

      </div>
    </div>
  );
}