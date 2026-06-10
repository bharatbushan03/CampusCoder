'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  Target, 
  Award, 
  CheckCircle, 
  Code2, 
  Zap, 
  Gift, 
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AnimatedSection, AnimatedCard } from '@/components/animations/ScrollAnimations';

// Target date: June 22, 2026, 6:00 PM IST (UTC+5:30)
const EVENT_DATE = new Date('2026-06-22T18:00:00+05:30');

const benefits = [
  'Daily DSA Challenges',
  'Real Interview-Level Questions',
  'Competitive Coding Practice',
  'Performance Leaderboard',
  'Networking with Peers',
  'Resume Value',
  'Certificates for Eligible Participants'
];

const prizes = [
  'HackerRank Infinity Plan Access',
  'Mock Interview Credits',
  'Access to 1500+ AI Tools',
  'Exclusive CampusCoder Merchandise & Goodies',
  'Recognition on Community Platforms'
];

export function SpecialEventSection() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = EVENT_DATE.getTime() - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12 md:py-24 border-b border-slate-800/40 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-10 space-y-4" direction="up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest">
            <Zap className="h-3 w-3" /> Special Event
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-mono">
            Upcoming <span className="text-emerald-500">Challenge</span>
          </h2>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            Join the most intensive algorithmic coding event of the year.
          </p>
        </AnimatedSection>

        <AnimatedCard className="max-w-5xl mx-auto" delay={0.1}>
          <Card className="border-emerald-500/30 bg-slate-900/60 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              {/* Left Column: Event Details */}
              <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/60">
                <div className="space-y-6">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-mono font-bold uppercase tracking-widest">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Registration Open
                    </div>
                    <Badge variant="default" className="border border-emerald-500/30 text-emerald-400 font-mono text-[10px] uppercase tracking-widest bg-transparent">
                      Powered by HackerRank
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-3xl md:text-4xl font-extrabold text-white leading-tight font-mono">
                      7 Days DSA Challenge 2026
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
                      A 7-day intensive Data Structures and Algorithms challenge designed to help students improve problem-solving skills, coding efficiency, and interview preparation through daily coding contests and learning sessions.
                    </p>
                  </div>

                  {/* Date & Time */}
                  <div className="flex flex-wrap gap-6 pt-2">
                    <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      <Calendar className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">Duration</p>
                        <p className="text-sm font-semibold text-slate-200">22 June - 28 June 2026</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      <Clock className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">Time</p>
                        <p className="text-sm font-semibold text-slate-200">6:00 PM - 9:00 PM IST</p>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="pt-6">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold mb-3">Event Starts In</p>
                    <div className="flex gap-4">
                      {[
                        { label: 'Days', value: timeLeft.days },
                        { label: 'Hours', value: timeLeft.hours },
                        { label: 'Mins', value: timeLeft.minutes },
                        { label: 'Secs', value: timeLeft.seconds },
                      ].map((item) => (
                        <div key={item.label} className="flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl w-16 h-16 md:w-20 md:h-20 shadow-inner">
                          <span className="text-xl md:text-2xl font-extrabold text-emerald-400 font-mono tabular-nums leading-none">
                            {item.value.toString().padStart(2, '0')}
                          </span>
                          <span className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-mono font-bold">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/60">
                  <Link href="/register">
                    <Button variant="primary" size="lg" className="w-full md:w-auto px-8 py-6 text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all">
                      Register Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: Benefits & Prizes */}
              <div className="lg:col-span-5 bg-slate-950/40 p-8 md:p-10 flex flex-col gap-8 relative overflow-hidden">
                {/* Background glow in right panel */}
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
                
                {/* Benefits */}
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-emerald-400" />
                    <h4 className="text-base font-bold text-slate-100 font-mono tracking-tight">What You Get</h4>
                  </div>
                  <ul className="space-y-3">
                    {benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500/70 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-300 leading-relaxed">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Prizes */}
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Gift className="h-5 w-5 text-emerald-400" />
                    <h4 className="text-base font-bold text-slate-100 font-mono tracking-tight">Prizes & Perks</h4>
                  </div>
                  <ul className="space-y-3">
                    {prizes.map((prize) => (
                      <li key={prize} className="flex items-start gap-2">
                        <Award className="h-4 w-4 text-emerald-500/70 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-300 leading-relaxed">{prize}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          </Card>
        </AnimatedCard>
      </div>
    </section>
  );
}
