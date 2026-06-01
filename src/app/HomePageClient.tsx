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
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';
import DynamicHeroCodeScene from '@/components/3d/DynamicHeroCodeScene';

type AnnouncementRow = Database['public']['Tables']['announcements']['Row'];
type CommunityLinkRow = Database['public']['Tables']['community_links']['Row'];

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
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
                  <Button variant="primary" size="lg" className="w-full sm:w-auto h-12 px-8">
                    Explore Sprints <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8">
                    Join Community
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: 3D Coding Scene */}
            <div className="lg:col-span-5 w-full h-[350px] md:h-[400px] lg:h-[500px]">
              <DynamicHeroCodeScene />
            </div>

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
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white font-mono">Specialized <span className="text-emerald-500">Ecosystem</span></h2>
            <p className="text-slate-400 text-lg leading-relaxed">Everything you need to transform from a student to a high-impact developer.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {offerings.map((item) => (
              <Card key={item.title} className="p-8 border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-all group">
                <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                  <item.icon className="size-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-mono">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* 4. Why Join? */}
      <section className="py-24 md:py-32 border-t border-slate-800/40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
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
            </div>
            
            <div className="relative">
              <Card className="aspect-square bg-slate-900/40 border-slate-800 p-1 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 z-0"></div>
                <div className="relative z-10 text-center space-y-4 p-8">
                  <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 inline-block shadow-2xl animate-float">
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
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 size-24 bg-emerald-500/10 rounded-full blur-2xl animate-pulse-slow"></div>
              <div className="absolute -bottom-8 -left-8 size-32 bg-cyan-500/10 rounded-full blur-2xl animate-pulse-slow delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Final CTA */}
      <section className="py-24 md:py-32 relative overflow-hidden bg-emerald-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
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
              <Link href="/register">
                <Button variant="primary" size="lg" className="w-full sm:w-auto px-10 h-14 text-lg">
                  Join the Community
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-10 h-14 text-lg border-slate-700">
                  Explore Sprints
                </Button>
              </Link>
            </div>
            
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
          </Card>
        </div>
      </section>
    </div>
  );
}
