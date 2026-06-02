'use client';

import React from 'react';
import { Shield, Target, Users2, Code2, Users, Trophy, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { TechBackground } from '@/components/animations/TechBackground';
import { AnimatedSection, AnimatedCard, CounterStat } from '@/components/animations/ScrollAnimations';

const teamMembers = [
  {
    name: 'Bharat Bhushan',
    role: 'Community Lead & Founder',
    bio: 'Web Developer & UI/UX enthusiast passionate about building developer communities and peer mentorship networks.',
    icon: Shield,
  },
  {
    name: 'Siddharth Sharma',
    role: 'Technical Lead',
    bio: 'Systems Engineer & algorithm designer focused on high-performance web systems and competitive programming platforms.',
    icon: Code2,
  },
  {
    name: 'Anjali Verma',
    role: 'Operations & Event Coordinator',
    bio: 'Creative organizer behind student workshops, placement prep sprints, and collaboration hackathons.',
    icon: Users2,
  }
];

const stats = [
  { value: 500, suffix: '+', label: 'Active Members', icon: Users },
  { value: 32, suffix: '', label: 'Developer Sprints', icon: Trophy },
  { value: 12, suffix: '+', label: 'Senior Mentors', icon: GraduationCap },
];

export default function AboutPageClient() {
  return (
    <div className="tech-grid min-h-screen py-16 selection:bg-emerald-500/30 relative">
      <TechBackground />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-24">
        
        {/* Header Section */}
        <AnimatedSection className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest">
            <Target className="h-3 w-3" /> Our Mission
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-mono">
            About <span className="text-emerald-500">CampusCoder</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            CampusCoder is a student-led developer community designed to bridge the gap between academic theory and practical software engineering. We organize workshops, coding challenges, and peer-learning ecosystems to help students transform into high-impact builders.
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
              We realized that while students learn standard programming basics, they rarely get the opportunity to build full-scale projects, write clean modular code, or prepare for real-world placements in a collaborative environment.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              CampusCoder was founded as an open platform for peer learning. By hosting hands-on coding sprints and technical mock interview prep, we enable seniors to pass down their expertise to juniors, shaping a highly skilled campus developer community.
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
                    <span>100% Practical, Project-Centric Sprints</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500"></span>
                    <span>Inclusive & Zero-Barriers Entrance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500"></span>
                    <span>Active Open-Source Collaboration</span>
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
              The student organizers and builders behind CampusCoder&apos;s sessions and technical systems.
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
