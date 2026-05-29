'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Calendar,
  Code2,
  Trophy,
  Users,
  MessageSquare,
  Laptop,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Clock,
  MapPin,
  ArrowUpRight,
  Megaphone,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { placeholderEvents } from '@/lib/placeholderData';
import { createClient } from '@/utils/supabase/client';

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [communityLinks, setCommunityLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient() as any;
        const now = new Date().toISOString();

        const [annRes, linksRes] = await Promise.all([
          supabase
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .lte('publish_date', now)
            .order('publish_date', { ascending: false })
            .limit(3),
          supabase
            .from('community_links')
            .select('*')
            .eq('is_active', true)
        ]);

        if (annRes.data) setAnnouncements(annRes.data);
        if (linksRes.data) setCommunityLinks(linksRes.data);
      } catch (err) {
        console.warn('Home page fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Get first 3 upcoming events
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
    'Active, competitive, yet collaborative student coding culture',
  ];

  return (
    <div className="tech-grid min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-36 border-b border-emerald-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-400 mb-6 animate-pulse">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            Building the next generation of campus builders
          </div>
          
          <h1 className="font-mono text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4">
            &lt;<span className="text-emerald-500">CampusCoder</span> /&gt;
          </h1>
          
          <p className="text-xl md:text-3xl font-bold tracking-tight text-slate-300 mb-6 max-w-2xl mx-auto">
            Code. Connect. Grow.
          </p>
          
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A virtual student coding community where developers connect, practice coding, prepare for placements, and build real-world skills through interactive sessions.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/events" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto flex items-center justify-center gap-2">
                Explore Events <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto flex items-center justify-center gap-2 border-emerald-500/30">
                Join Community
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      </section>

      {/* Announcements & Community Links Section */}
      {(announcements.length > 0 || communityLinks.length > 0) && (
        <section className="py-12 bg-slate-900/20 border-b border-emerald-500/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Announcements Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Megaphone className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">Latest Announcements</h3>
                </div>
                {announcements.length > 0 ? (
                  <div className="space-y-3">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-colors">
                        <h4 className="text-sm font-bold text-white mb-1">{ann.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{ann.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-mono italic">No active announcements.</p>
                )}
              </div>

              {/* Community Links Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">Join Channels</h3>
                </div>
                {communityLinks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    {communityLinks.map((link) => (
                      <a 
                        key={link.id} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group"
                      >
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-tight">{link.platform}</span>
                        <ExternalLink className="h-3 w-3 text-emerald-500/50 group-hover:text-emerald-400" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-mono italic">Links coming soon.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. About CampusCoder */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-emerald-500/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">About Community</h2>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">
              Bridge the Gap Between Academics and Building
            </h3>
            <p className="text-slate-400 mb-4 leading-relaxed">
              CampusCoder is a virtual, student-led developer hub that empowers college coding enthusiasts. We understand that university courses provide theory, but true mastery comes from active building and collaborative problem-solving.
            </p>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Through peer mentorship, virtual workshops, live coding sprints, and structured placement drives, we create an environment where any student can grow from writing basic hello world scripts to deploying enterprise-ready applications.
            </p>
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-900">
              <div>
                <p className="text-2xl font-bold text-white font-mono">500+</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Students</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-mono">40+</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Workshops</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-mono">15+</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Mentors</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 rounded-2xl blur-lg pointer-events-none"></div>
            <Card hoverEffect={false} className="relative z-10 border-emerald-500/20 bg-slate-900/80 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="font-mono text-xs text-slate-500 ml-auto">campus_coder.py</span>
              </div>
              <pre className="font-mono text-sm text-emerald-400 overflow-x-auto whitespace-pre p-2 bg-slate-950/80 rounded border border-emerald-500/5">
                <code>{`class CampusCoder:
    def __init__(self):
        self.focus = ["Coding", "Career", "Community"]
        self.stack = ["React", "TypeScript", "DSA"]
        
    def goal(self):
        return "Learn by doing"
        
    def join(self, student):
        student.skills += "🚀"
        student.confidence += 100
        return "Welcome to the future!"`}</code>
              </pre>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. What We Offer */}
      <section className="py-20 md:py-28 border-b border-emerald-500/10 bg-slate-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">Our Pillars</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Empowering Every Step of Your Dev Journey</h3>
            <p className="text-slate-400">
              Whether you are compiling your first loop, optimizing graph pipelines, or preparing for high-paying technical interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.map((offering, idx) => {
              const Icon = offering.icon;
              return (
                <Card key={idx} className="flex flex-col h-full">
                  <div className="h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{offering.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{offering.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Upcoming Events Preview */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-emerald-500/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">Happening Soon</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-white">Upcoming Events & Sprints</h3>
          </div>
          <Link href="/events" className="mt-4 md:mt-0 flex items-center gap-1 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group">
            View All Events <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredEvents.map((event) => (
            <Card key={event.id} className="flex flex-col justify-between h-full group">
              <div>
                {/* Event Category Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 capitalize">
                    {event.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(event.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {event.title}
                </h4>
                <p className="text-sm text-slate-400 mb-6 line-clamp-3">
                  {event.description}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-900/60">
                <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
                
                <Link href={`/events/${event.slug || getSlug(event.title)}`} className="block">
                  <Button variant="secondary" size="sm" className="w-full justify-between group-hover:bg-slate-800">
                    Learn & Register <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. Why Join Us */}
      <section className="py-20 md:py-28 bg-slate-950/30 border-b border-emerald-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">Why Us?</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Designed Specifically for Aspiring Engineers</h3>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Coding alone in your hostel room can be exhausting. Joining CampusCoder links you with a vibrant network of developers who push boundaries daily. Here is what makes us unique:
              </p>
              
              <ul className="space-y-4">
                {whyJoinReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300 text-sm leading-relaxed">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Card hoverEffect={false} className="border-emerald-500/5 bg-slate-900/40 p-6 text-center">
                  <span className="block text-3xl font-mono font-bold text-emerald-400 mb-1">0%</span>
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Cost (100% Free)</span>
                </Card>
                <Card hoverEffect={false} className="border-emerald-500/5 bg-slate-900/40 p-6 text-center">
                  <span className="block text-3xl font-mono font-bold text-emerald-400 mb-1">24/7</span>
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Discord Support</span>
                </Card>
              </div>
              <div className="space-y-4 pt-8">
                <Card hoverEffect={false} className="border-emerald-500/5 bg-slate-900/40 p-6 text-center">
                  <span className="block text-3xl font-mono font-bold text-emerald-400 mb-1">100%</span>
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Hands-on Sprints</span>
                </Card>
                <Card hoverEffect={false} className="border-emerald-500/5 bg-slate-900/40 p-6 text-center">
                  <span className="block text-3xl font-mono font-bold text-emerald-400 mb-1">Top</span>
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Alumni Network</span>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call to Action */}
      <section className="py-24 relative overflow-hidden bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Card className="border-emerald-500/30 bg-gradient-to-b from-slate-900 to-slate-950/80 p-10 md:p-16 glow-box">
            <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Ready to Upgrade Your Skills?
            </h3>
            <p className="text-slate-400 text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              Don&apos;t practice in isolation. Join the CampusCoder community today, RSVP for upcoming workshops, and jumpstart your software engineering career.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Join CampusCoder Now
                </Button>
              </Link>
              <Link href="/events" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-slate-300">
                  Browse Workshops
                </Button>
              </Link>
            </div>
          </Card>
        </div>
        
        {/* Glow ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      </section>
    </div>
  );
}
