'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ArrowRight,
  MessageSquare,
  Users,
  Code2,
  Target,
  CheckCircle,
  ChevronRight,
  BookOpen,
  Clock,
  Rocket,
  Phone,
  Sparkles,
  Hash,
  Quote,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';
import { placeholderEvents } from '@/lib/placeholderData';
import { EVENT_DATE_LABEL, EVENT_TIME_LABEL } from '@/lib/eventSchedule';
import DynamicHeroCodeScene from '@/components/3d/DynamicHeroCodeScene';
import { AnimatedSection } from '@/components/animations/ScrollAnimations';

type EventRow = Database['public']['Tables']['events']['Row'];

const programs = [
  {
    title: 'Placement Coding Sprint',
    description: 'Practice DSA with problem-solving sessions on arrays, strings, DP, graphs, and system design. Led by seniors who have been through campus placements.',
    gain: 'Mock interviews, resume reviews, and coding assessments',
    level: 'Intermediate – Advanced',
    icon: Target,
  },
  {
    title: 'HackerRank Practice Sessions',
    description: 'Solve curated problems every week with live walkthroughs and complexity analysis.',
    gain: 'Consistent practice, contest exposure, ranking improvement',
    level: 'Beginner – Intermediate',
    icon: Code2,
  },
  {
    title: 'Beginner Coding Workshops',
    description: 'Build projects with React, Node.js, Python, and modern web tools.',
    gain: 'Portfolio projects, framework skills, deployment experience',
    level: 'Beginner – Intermediate',
    icon: BookOpen,
  },
  {
    title: 'Weekly Code Hour',
    description: 'Open one-hour sessions to solve problems together, discuss approaches, and debug as a group.',
    gain: 'Consistency, peer debugging, confidence building',
    level: 'All levels',
    icon: Clock,
  },
  {
    title: 'Peer Learning Circles',
    description: 'Small group study circles focused on specific topics — from Python basics to advanced system design. Learn with classmates at your pace.',
    gain: 'Collaborative learning, mentorship, accountability',
    level: 'All levels',
    icon: Users,
  },
];

const trustIndicators = [
  { label: 'Student-led community', icon: Users },
  { label: 'Hands-on workshops', icon: BookOpen },
  { label: 'Coding challenges', icon: Code2 },
  { label: 'Placement prep', icon: Target },
];

const howItWorks = [
  {
    step: 1,
    title: 'Register for an event',
    description: 'Browse upcoming sessions and reserve your spot.',
    icon: Calendar,
  },
  {
    step: 2,
    title: 'Join community channels',
    description: 'Connect with fellow students on Discord and WhatsApp. Get updates, share code, ask questions.',
    icon: MessageSquare,
  },
  {
    step: 3,
    title: 'Code with peers',
    description: 'Show up to sessions, solve problems together, and keep learning.',
    icon: Rocket,
  },
];

const benefits = [
  {
    title: 'Build consistency',
    description: 'Regular weekly sessions keep you coding even when motivation dips. Show up, solve problems, and build a habit.',
    icon: TrendingUp,
  },
  {
    title: 'Learn with peers',
    description: 'Stuck on a problem? Someone in the community has solved it before. Ask, discuss, and learn together.',
    icon: Users,
  },
  {
    title: 'Practice for coding rounds',
    description: 'Mock interviews, timed contests, and live walkthroughs that mirror real assessment environments.',
    icon: Code2,
  },
  {
    title: 'Understand coding platforms',
    description: 'Get comfortable with HackerRank, LeetCode-style interfaces, and submission workflows used in placements.',
    icon: BarChart3,
  },
  {
    title: 'Prepare for placements gradually',
    description: 'No last-minute cramming. Start early, follow a path, and build skills step by step with peer support.',
    icon: Target,
  },
];

const founderNote = {
  text: 'CampusCoder is a student-led community created to help students practice coding consistently and stay connected through events and peer learning.',
  author: '— Community Organizers',
};

const communityChannels = [
  {
    platform: 'Discord',
    url: 'https://discord.gg/VdsX64E5E',
    description: 'Daily coding discussions, event announcements, live help channels, and voice sessions.',
    icon: MessageSquare,
    cta: 'Join Discord',
    variant: 'primary' as const,
  },
  {
    platform: 'WhatsApp',
    url: 'https://chat.whatsapp.com/KLOHfAjbu91IP5C9SqPnP2',
    description: 'Quick updates, poll reminders, and peer chats. Best for staying in touch on the go.',
    icon: Phone,
    cta: 'Join WhatsApp',
    variant: 'secondary' as const,
  },
];

const snapshotDefaults = {
  firstSession: 'May 2026',
  studentsAttended: 30,
  upcomingWorkshops: 3,
  practiceCommunity: '12+ weekly participants',
};

function getSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function HomePage() {
  const [featuredEvent, setFeaturedEvent] = useState<EventRow | null>(null);
  const [completedEvents, setCompletedEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        const [featuredRes, completedRes] = await Promise.all([
          supabase
            .from('events')
            .select('*')
            .eq('status', 'published')
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date', { ascending: true })
            .limit(1)
            .returns<EventRow[]>(),
          supabase
            .from('events')
            .select('*')
            .eq('status', 'completed')
            .order('date', { ascending: false })
            .limit(3)
            .returns<EventRow[]>(),
        ]);

        if (featuredRes.data && featuredRes.data.length > 0) {
          setFeaturedEvent(featuredRes.data[0]);
        }
        if (completedRes.data && completedRes.data.length > 0) {
          setCompletedEvents(completedRes.data);
        }
      } catch {
        // Use placeholder fallbacks
      }
    };

    void fetchData();
  }, []);

  const fallbackEvent = placeholderEvents[0];

  return (
    <div className="min-h-screen">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden pt-16 pb-12 md:pt-28 md:pb-24 border-b border-slate-800/40">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <AnimatedSection className="lg:col-span-7 space-y-6" direction="left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-50 leading-[1.15]">
                Practice coding with{' '}
                <span className="text-emerald-400">students like you</span>
              </h1>
              <p className="text-base md:text-lg text-slate-400 max-w-xl leading-relaxed">
                A student-run community for workshops, placement prep, coding challenges, and peer learning.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/events">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto h-12 px-8">
                    Explore Events <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto h-12 px-8">
                    Join Community
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4">
                {trustIndicators.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <item.icon className="size-3.5 text-slate-500" />
                    {item.label}
                  </div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection className="lg:col-span-5 w-full h-[220px] sm:h-[320px] md:h-[380px] lg:h-[440px]" direction="right">
              <DynamicHeroCodeScene />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── COMMUNITY SNAPSHOT ─── */}
      <section className="py-12 md:py-16 border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-8 md:mb-10" direction="up">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-50">
              Community snapshot
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Real activity from a growing student coding community.
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="text-center p-5 rounded-xl border border-slate-800/60 bg-slate-900/30">
              <Calendar className="size-5 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-50">First session</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">{snapshotDefaults.firstSession}</p>
            </div>
            <div className="text-center p-5 rounded-xl border border-slate-800/60 bg-slate-900/30">
              <Users className="size-5 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-50">Students attended</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">{snapshotDefaults.studentsAttended}+</p>
            </div>
            <div className="text-center p-5 rounded-xl border border-slate-800/60 bg-slate-900/30">
              <Sparkles className="size-5 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-50">Upcoming workshops</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">{snapshotDefaults.upcomingWorkshops}</p>
            </div>
            <div className="text-center p-5 rounded-xl border border-slate-800/60 bg-slate-900/30">
              <Hash className="size-5 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-50">Active practice</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">{snapshotDefaults.practiceCommunity}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section className="py-12 md:py-24 border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="max-w-3xl mx-auto text-center space-y-6" direction="up">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-50">
              Learn with people headed the same way
            </h2>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed">
              Most students learn to code alone — jumping between tutorials, unsure what to focus on. CampusCoder gives you structure, peer accountability, and guidance from seniors who have been through the same journey.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              {[
                { label: 'Structured path', desc: 'No more guessing what to learn next' },
                { label: 'Peer accountability', desc: 'Code with friends, stay consistent' },
                { label: 'Placement ready', desc: 'Build skills that matter for interviews' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-800/60 bg-slate-900/30 p-4 text-left">
                  <p className="text-sm font-semibold text-slate-200">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── PROGRAMS ─── */}
      <section className="py-12 md:py-24 border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-12 space-y-3" direction="up">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-50">
                What we offer
              </h2>
              <p className="text-sm text-slate-400">
                Sessions built around practice, projects, and peer learning.
              </p>
          </AnimatedSection>
          <div className="space-y-4">
            {programs.map((program, idx) => (
              <AnimatedSection key={program.title} delay={idx * 0.05}>
                <Card hoverEffect className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                      <program.icon className="size-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <h3 className="text-base md:text-lg font-semibold text-slate-50">
                          {program.title}
                        </h3>
                        <Badge variant="default" className="shrink-0">
                          {program.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                        {program.description}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-emerald-400">
                        <CheckCircle className="size-3.5" />
                        <span>{program.gain}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STUDENT BENEFITS ─── */}
      <section className="py-12 md:py-24 border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-12 space-y-3" direction="up">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-50">
              What students get out of it
            </h2>
            <p className="text-sm text-slate-400">
              Real outcomes from showing up consistently and coding with peers.
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((benefit, idx) => (
              <AnimatedSection key={benefit.title} delay={idx * 0.06}>
                <Card hoverEffect className="p-5 h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center size-9 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                      <benefit.icon className="size-4 text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-50">{benefit.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{benefit.description}</p>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED EVENT ─── */}
      <section className="py-12 md:py-24 border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-10 space-y-3" direction="up">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-50">
                Next event
            </h2>
            <p className="text-sm text-slate-400">
                See what is coming up and grab your spot.
            </p>
          </AnimatedSection>

          {(featuredEvent || fallbackEvent) && (
            <AnimatedSection className="max-w-2xl mx-auto" delay={0.1}>
              <Card hoverEffect className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="accent">
                        {(featuredEvent?.event_type || fallbackEvent.type).replace('_', ' ')}
                      </Badge>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-50 leading-tight">
                      {featuredEvent?.title || fallbackEvent.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                      {featuredEvent?.short_description || fallbackEvent.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-slate-600" />
                        {EVENT_DATE_LABEL}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-slate-600" />
                        {EVENT_TIME_LABEL}
                      </span>
                    </div>
                    <Link
                      href={`/events/${featuredEvent?.slug || getSlug(fallbackEvent.title)}`}
                    >
                      <Button variant="primary" size="md" className="mt-2">
                        View details <ChevronRight className="ml-1 size-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </AnimatedSection>
          )}

          <div className="text-center mt-8">
            <Link href="/events">
              <Button variant="outline" size="md">
                View all events <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PAST EVENTS ─── */}
      <section className="py-12 md:py-24 border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-12 space-y-3" direction="up">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-50">
              Past events
            </h2>
            <p className="text-sm text-slate-400">
              Sessions we have run so far in the community.
            </p>
          </AnimatedSection>

          {completedEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {completedEvents.map((ev, idx) => (
                <AnimatedSection key={ev.id} delay={idx * 0.08}>
                  <Card hoverEffect className="p-5 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="default">{ev.event_type.replace('_', ' ')}</Badge>
                      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-medium border bg-slate-800 border-slate-700 text-slate-400 capitalize">
                        Completed
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-50 leading-snug mb-2">{ev.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 flex-1">
                      {ev.short_description || 'No description available.'}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-900 text-xs text-slate-500">
                      <span>{ev.date ? EVENT_DATE_LABEL : ''}</span>
                      <Link href={`/events/${ev.slug}`} className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                        Details <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          ) : (
            <AnimatedSection delay={0.05}>
              <div className="text-center py-12 bg-slate-900/10 border border-slate-900 rounded-xl">
                <p className="text-xs text-slate-500 font-mono">Past events will appear here once sessions are completed.</p>
              </div>
            </AnimatedSection>
          )}

          <div className="text-center mt-8">
            <Link href="/events/archive">
              <Button variant="outline" size="md">
                View event archive <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-12 md:py-24 border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-12 space-y-3" direction="up">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-50">
                How to get started
            </h2>
            <p className="text-sm text-slate-400">
                Join an event, connect with the community, and grow with peers.
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, idx) => (
              <AnimatedSection key={step.step} delay={idx * 0.1} className="text-center">
                <div className="flex items-center justify-center size-14 rounded-xl bg-slate-800 border border-slate-700 mx-auto">
                  <step.icon className="size-6 text-emerald-400" />
                </div>
                <div className="mt-2 mb-4 text-sm font-mono text-slate-500 font-bold">
                  Step {step.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-50">{step.title}</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  {step.description}
                </p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMMUNITY CHANNELS ─── */}
      <section className="py-12 md:py-24 border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-12 space-y-3" direction="up">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-50">
              Community channels
            </h2>
            <p className="text-sm text-slate-400">
              Two ways to stay connected. Pick the one that works for you.
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {communityChannels.map((channel) => (
              <AnimatedSection key={channel.platform} delay={0.1}>
                <Card hoverEffect className="p-6 h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                      <channel.icon className="size-5 text-emerald-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-50">{channel.platform}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-5">
                    {channel.description}
                  </p>
                  <a href={channel.url} target="_blank" rel="noopener noreferrer">
                    <Button variant={channel.variant} size="md" className="w-full">
                      {channel.cta}
                    </Button>
                  </a>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOUNDER NOTE ─── */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="max-w-2xl mx-auto text-center space-y-4" direction="up">
            <Quote className="size-8 text-emerald-400/50 mx-auto" />
            <p className="text-sm md:text-base text-slate-400 leading-relaxed italic">
              &ldquo;{founderNote.text}&rdquo;
            </p>
            <p className="text-xs text-slate-600 font-mono">{founderNote.author}</p>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
