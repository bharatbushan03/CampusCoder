'use client';

import React from 'react';
import { Shield, Target, Users2, Code2, Users, Trophy, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { TechBackground } from '@/components/animations/TechBackground';
import { AnimatedSection, AnimatedCard, CounterStat } from '@/components/animations/ScrollAnimations';

const teamMembers = [
  {
    name: 'Bharat Lashotra',
    role: 'Community Lead & Founder',
    bio: 'AI ML and Web Developer passionate about building developer communities and peer mentorship networks.',
    icon: Shield,
  },
  {
    name: 'Rajeev Sharma',
    role: 'Core Team Member',
    bio: 'passionate about Machine Learning and AI enthusiast passionate about building developer communities and peer mentorship networks.',
    icon: Code2,
  },
  {
    name: 'Saloni Sharma',
    role: 'Core Team Member',
    bio: 'Organizing workshops, managing events, and ensuring everyone has a great learning experience.',
    icon: Users2,
  },
  {
    name: 'Ishita Sethi',
    role: 'Core Team Member',
    bio: 'Focused on creating engaging learning materials and coordinating community outreach.',
    icon: Target,
  },
  {
    name: 'Zarik Rasool',
    role: 'Core Team Member',
    bio: 'Helping students bridge the gap between theoretical knowledge and practical application.',
    icon: Users,
  },
  {
    name: 'Aarush Bharti',
    role: 'Core Team Member',
    bio: 'Passionate about coding challenges and competitive programming platforms.',
    icon: Trophy,
  }
];

const stats = [
  { value: 200, suffix: '+', label: 'Active Members', icon: Users },
  { value: 2, suffix: '', label: 'Events Organized', icon: Trophy },
  { value: 8, suffix: '+', label: 'Mentors', icon: GraduationCap },
];

export default function AboutPageClient() {
  return (
    <div className="tech-grid min-h-screen py-16 selection:bg-emerald-500/30 relative">
      <TechBackground />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-24">
        
        {/* Header Section */}
        <AnimatedSection className="space-y-4 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-mono">
            About <span className="text-emerald-500">CampusCoder</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            CampusCoder is a student-run community that helps you go from classroom theory to real coding skills. We organize workshops, coding challenges, and peer learning sessions.
          </p>
        </AnimatedSection>

        {/* Stats Section */}
        <AnimatedSection className="py-8" delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-8 border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-all text-center group">
                <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                  <stat.icon className="size-6 text-emerald-400" />
                </div>
                <h3 className="text-4xl font-extrabold text-white font-mono mb-2">
                  <CounterStat value={stat.value} suffix={stat.suffix} />
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium uppercase font-mono tracking-widest">{stat.label}</p>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <AnimatedSection className="space-y-6 text-left" direction="left" delay={0.2}>
            <h2 className="text-2xl md:text-3xl font-bold text-white font-mono">
              Why We <span className="text-emerald-500">Started</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Most students learn programming basics but rarely get to build real projects or prepare for placements together. CampusCoder exists to change that.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              We host coding sprints and mock interviews so seniors can share what they have learned with juniors. It is students helping students get better at coding.
            </p>
          </AnimatedSection>

          <AnimatedSection className="relative" direction="right" delay={0.2}>
            <Card className="aspect-video bg-slate-900/40 border-slate-800 p-8 flex flex-col justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 z-0"></div>
              <div className="relative z-10 space-y-3">
                <h4 className="text-emerald-400 font-mono text-xs uppercase tracking-widest">Our Core Values</h4>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500"></span>
                    <span>Project-first, not theory-only</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500"></span>
                    <span>Open to all, no experience needed</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500"></span>
                    <span>Collaborate on real open-source projects</span>
                  </li>
                </ul>
              </div>
            </Card>
          </AnimatedSection>
        </div>

        {/* Team Section */}
        <AnimatedSection className="flex flex-col gap-12 text-center animate-fade-in" delay={0.3}>
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white font-mono">
              Meet the <span className="text-emerald-500">Team</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
              The students organizing CampusCoder events and building the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, idx) => (
              <AnimatedCard key={member.name} className="p-8 border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 transition-all flex flex-col h-full items-center text-center gap-y-4" delay={idx * 0.15}>
                <div className="size-14 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center shadow-lg">
                  <member.icon className="size-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{member.name}</h4>
                  <p className="text-xs text-emerald-400 font-mono mt-1">{member.role}</p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed flex-1">
                  {member.bio}
                </p>
              </AnimatedCard>
            ))}
          </div>
        </AnimatedSection>

      </div>
    </div>
  );
}
