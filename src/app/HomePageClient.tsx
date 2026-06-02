'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Code2,
  Trophy,
  Users,
  MessageSquare,
  Laptop,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Megaphone,
  ExternalLink,
  Calendar,
  Clock,
  ArrowUpRight,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';
import DynamicHeroCodeScene from '@/components/3d/DynamicHeroCodeScene';
import { AnimatedEventCard } from '@/components/AnimatedEventCard';
import { placeholderEvents } from '@/lib/placeholderData';
import { TechBackground } from '@/components/animations/TechBackground';
import DynamicCommunityGlobe from '@/components/3d/DynamicCommunityGlobe';
import { AnimatedSection, AnimatedCard, MotionButton } from '@/components/animations/ScrollAnimations';

type AnnouncementRow = Database['public']['Tables']['announcements']['Row'];
type CommunityLinkRow = Database['public']['Tables']['community_links']['Row'];

function getSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const featuredEvents = placeholderEvents.slice(0, 3);

const offerings = [
  {
    title: 'Coding Workshops',
    description: 'Hands-on practical sessions building full-stack web apps, mobile apps, and developer setups.',
    icon: Laptop,
  },
  {
    title: 'Placement Preparation',
    description: 'Mock interviews, resume feedback, and data structures & algorithms guides led by seniors.',
    icon: Briefcase,
  },
  {
    title: 'HackerRank Practice Sessions',
    description: 'Regular group programming challenges focusing on logical thinking and core algorithm topics.',
    icon: Code2,
  },
  {
    title: 'Weekly Coding Challenges',
    description: 'Compete in campus leagues, track progress, and win coding swag/achievements.',
    icon: Trophy,
  },
  {
    title: 'Peer Learning',
    description: 'Collaborate with teammates on student projects, open-source repositories, and hackathons.',
    icon: Users,
  },
  {
    title: 'Community Discussions',
    description: 'Ask questions, share advice, and connect through Discord and local tech meetups.',
    icon: MessageSquare,
  },
];

const whyJoinReasons = [
  'Beginner-friendly sessions with zero prerequisite hurdles',
  'Practical, project-centric learning instead of just theory',
  'Direct community support and code reviews from peer mentors',
  'Regular virtual and in-person campus events and speaker panels',
  'A fresh student community you can help shape from day one',
];

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [communityLinks, setCommunityLinks] = useState<CommunityLinkRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const now = new Date().toISOString();

        const [annRes, linksRes] = await Promise.all([
          supabase
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .lte('publish_date', now)
            .order('publish_date', { ascending: false })
            .limit(3)
            .returns<AnnouncementRow[]>(),
          supabase
            .from('community_links')
            .select('*')
            .eq('is_active', true)
            .returns<CommunityLinkRow[]>()
        ]);

        if (annRes.data) setAnnouncements(annRes.data);
        if (linksRes.data) setCommunityLinks(linksRes.data);
      } catch (err) {
        console.warn('Home page fetch error:', err);
      }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, []);

  return (
    <div className="tech-grid min-h-screen selection:bg-emerald-500/30">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-32 border-b border-slate-800/40">
        <TechBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Hero Text */}
            <AnimatedSection className="lg:col-span-7 text-left space-y-8" direction="left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest">
                <span className="relative flex size-2">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                </span>
                Community for Builders
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                Build the future of <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500">
                  campus innovation.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
                A student-led tech community focused on workshops, hands-on coding sprints, and professional placement preparation.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-start gap-4 pt-4">
                <Link href="/events" className="w-full sm:w-auto">
                  <MotionButton className="w-full sm:w-auto">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto h-12 px-8">
                      Explore Sprints <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </MotionButton>
                </Link>
                <Link href="/register" className="w-full sm:w-auto">
                  <MotionButton className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8">
                      Join Community
                    </Button>
                  </MotionButton>
                </Link>
              </div>
            </AnimatedSection>

            {/* Right Column: 3D Coding Scene */}
            <AnimatedSection className="lg:col-span-5 w-full h-[350px] md:h-[400px] lg:h-[500px]" direction="right">
              <DynamicHeroCodeScene />
            </AnimatedSection>

          </div>
        </div>

        {/* Dynamic Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <div className="absolute -top-24 -right-24 size-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        <div className="absolute -bottom-24 -left-24 size-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      </section>

      {/* Announcements & Community Links Section */}
      {(announcements.length > 0 || communityLinks.length > 0) && (
        <section className="py-16 md:py-24 border-b border-slate-800/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Announcements Column */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Megaphone className="size-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-slate-400">Latest Updates</h3>
                </div>
                {announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map((ann) => (
                      <Card key={ann.id} className="p-6 border-slate-800 hover:border-emerald-500/30 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="text-base font-bold text-white leading-tight">{ann.title}</h4>
                            <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{ann.message}</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-600 whitespace-nowrap mt-1">
                            {new Date(ann.publish_date).toLocaleDateString()}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 font-mono italic">No active announcements.</p>
                )}
              </div>

              {/* Community Links Column */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Users className="size-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-slate-400">Join Channels</h3>
                </div>
                {communityLinks.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {communityLinks.map((link) => (
                      <a 
                        key={link.id} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 hover:bg-slate-900 transition-all group"
                      >
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                          {link.platform}
                        </span>
                        <ExternalLink className="size-4 text-slate-600 group-hover:text-emerald-400 transition-all" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 font-mono italic">Links coming soon.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. What we offer */}
      <section className="py-24 md:py-32 relative overflow-hidden border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white font-mono">Specialized <span className="text-emerald-500">Ecosystem</span></h2>
            <p className="text-slate-400 text-lg leading-relaxed">Everything you need to transform from a student to a high-impact developer.</p>
          </AnimatedSection>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {offerings.map((item, index) => (
              <AnimatedCard key={item.title} className="flex flex-col h-full" delay={index * 0.1}>
                <Card className="p-8 border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-all group h-full">
                  <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                    <item.icon className="size-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 font-mono">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                </Card>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Connected Coding Community Section */}
      <section className="py-24 md:py-32 border-b border-slate-800/40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Content */}
            <AnimatedSection className="lg:col-span-6 space-y-6 text-left" direction="left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest">
                <span className="relative flex size-2">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                </span>
                Global Network
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white font-mono leading-tight">
                Connected Coding <br />
                <span className="text-emerald-500">Community</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                CampusCoder brings students together through virtual events, workshops, coding challenges, and peer learning activities. Build relationships, prepare for placements, and collaborate on real-world projects.
              </p>
            </AnimatedSection>
            
            {/* Right Column: 3D Globe */}
            <AnimatedSection className="lg:col-span-6 w-full h-[350px] md:h-[400px] lg:h-[500px]" direction="right">
              <DynamicCommunityGlobe />
            </AnimatedSection>
          </div>
        </div>
      </section>
      {/* 3. Upcoming Events Snippet */}
      <section className="py-24 md:py-32 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white font-mono">Upcoming <span className="text-emerald-500">Sprints</span></h2>
              <p className="text-slate-400 text-lg max-w-xl">Reserve your spot in our upcoming hands-on learning sessions.</p>
            </div>
            <Link href="/events">
              <MotionButton>
                <Button variant="outline" size="md" className="group">
                  View All Events <ArrowUpRight className="ml-2 size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </MotionButton>
            </Link>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredEvents.map((ev, index) => (
              <AnimatedEventCard key={ev.id} delay={index * 0.15} className="group flex flex-col h-full bg-slate-950 overflow-hidden">
                <div className="h-48 bg-slate-900 overflow-hidden relative border-b border-slate-900">
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <Layers className="size-10 text-slate-800 transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:text-emerald-400" />
                  </div>
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-2 py-1 rounded bg-slate-950/80 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      {ev.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-tighter mb-3">
                      <span className="flex items-center gap-1"><Calendar className="size-3" /> {ev.date}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" /> {ev.time.split(' ')[0]}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{ev.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-6">{ev.description}</p>
                  </div>
                  <Link href={`/events/${getSlug(ev.title)}`} className="mt-auto block">
                    <Button variant="secondary" size="md" className="w-full font-bold">
                      View Details
                    </Button>
                  </Link>
                </div>
              </AnimatedEventCard>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Why Join? */}
      <section className="py-24 md:py-32 border-t border-slate-800/40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection className="space-y-8" direction="left">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white font-mono">Why Join <br /><span className="text-emerald-500">CampusCoder?</span></h2>
                <p className="text-slate-400 text-lg leading-relaxed">We provide more than just tutorials. We provide a path to professional excellence.</p>
              </div>
              
              <ul className="space-y-6">
                {whyJoinReasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-4 group">
                    <div className="mt-1 p-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <span className="text-slate-300 font-medium group-hover:text-white transition-colors">{reason}</span>
                  </li>
                ))}
              </ul>
            </AnimatedSection>
            
            <AnimatedSection className="relative" direction="right">
              <Card className="aspect-square bg-slate-900/40 border-slate-800 p-1 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 z-0"></div>
                <div className="relative z-10 text-center space-y-4 p-8">
                  <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 inline-block shadow-2xl motion-safe:animate-float">
                    <Terminal className="size-16 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white font-mono uppercase tracking-widest">Built by Students <br /> for Students</h3>
                  <div className="flex justify-center gap-2 pt-4">
                    <div className="h-1 w-12 rounded-full bg-emerald-500"></div>
                    <div className="h-1 w-4 rounded-full bg-emerald-500/30"></div>
                    <div className="h-1 w-4 rounded-full bg-emerald-500/30"></div>
                  </div>
                </div>
              </Card>
              <div className="absolute -top-4 -right-4 size-24 bg-emerald-500/10 rounded-full blur-2xl motion-safe:animate-pulse-slow"></div>
              <div className="absolute -bottom-8 -left-8 size-32 bg-cyan-500/10 rounded-full blur-2xl motion-safe:animate-pulse-slow delay-1000"></div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* 5. Final CTA */}
      <section className="py-24 md:py-32 relative overflow-hidden bg-emerald-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <AnimatedSection className="max-w-5xl mx-auto">
            <Card className="p-12 md:p-20 border-emerald-500/20 bg-slate-950/80 max-w-5xl mx-auto space-y-8 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              
              <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
                Ready to accelerate your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  coding journey?
                </span>
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                Be part of the first group shaping CampusCoder at our college.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/register" className="w-full sm:w-auto">
                  <MotionButton className="w-full sm:w-auto">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto px-10 h-14 text-lg">
                      Join the Community
                    </Button>
                  </MotionButton>
                </Link>
                <Link href="/events" className="w-full sm:w-auto">
                  <MotionButton className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto px-10 h-14 text-lg border-slate-700">
                      Explore Sprints
                    </Button>
                  </MotionButton>
                </Link>
              </div>
              
              {/* Background elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
            </Card>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
