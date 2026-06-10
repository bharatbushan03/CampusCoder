'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, Code2, Globe2, Trophy, Medal, Star, 
  CheckCircle, HelpCircle, ArrowRight, BookOpen, Target, 
  Layers, Database, Share2, Award, Zap, Mail, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AnimatedSection } from '@/components/animations/ScrollAnimations';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import dynamic from 'next/dynamic';

const DSA3DShowcase = dynamic(() => import('@/components/3d/DSA3DShowcase'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] md:h-[700px] bg-slate-950 flex items-center justify-center border-b border-slate-800/40">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 mb-4" />
        <div className="w-48 h-6 bg-slate-900 rounded mb-2" />
        <div className="w-64 h-4 bg-slate-900 rounded" />
      </div>
    </div>
  ),
});

// --- Hero using existing code principles but tailored ---
function LandingHero() {
  const eventDetails = [
    { icon: Calendar, text: '22-28 June 2026' },
    { icon: Clock, text: '6 PM - 9 PM IST' },
    { icon: Globe2, text: 'Virtual' },
    { icon: Code2, text: 'HackerRank' },
  ];

  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 border-b border-slate-800/60 bg-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[70%] bg-emerald-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(#10b981 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] mb-8">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-300 text-xs font-mono font-bold tracking-widest uppercase">7 Days Intensive Challenge</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
            Master DSA in <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">7 Days</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
            Join India's growing student developer community for an intensive HackerRank coding challenge. Improve your problem-solving skills, coding efficiency, and interview preparation.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 md:p-5 w-full max-w-3xl mx-auto mb-10">
            {eventDetails.map((detail, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-slate-300">
                <div className="flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg h-9 w-9 shrink-0">
                  <detail.icon className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-sm font-semibold tracking-wide whitespace-nowrap">{detail.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center mb-10">
            <p className="text-sm text-slate-500 font-mono font-bold uppercase tracking-widest mb-4">Event Starts In</p>
            <CountdownTimer targetDate={new Date('2026-06-22T18:00:00+05:30')} />
          </div>

          <Link href="#register">
            <Button variant="primary" size="lg" className="h-14 px-10 text-lg font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all">
              Register for Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// --- About Event ---
function AboutSection() {
  return (
    <section className="py-20 border-b border-slate-800/40 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection direction="up" className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Why participate?</h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-6">
              Data Structures and Algorithms form the foundation of technical interviews at top product-based companies. This 7-day challenge is designed to push you out of your comfort zone with curated, high-quality problems.
            </p>
            <p className="text-slate-400 text-lg leading-relaxed">
              Every day from 6:00 PM to 9:00 PM IST, a new contest will unlock on HackerRank. You'll compete with peers, learn optimal approaches, and track your progress on the global leaderboard.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Problems', value: '35+', icon: Code2 },
              { label: 'Daily Hours', value: '3 Hrs', icon: Clock },
              { label: 'Difficulty', value: 'Med-Hard', icon: Target },
              { label: 'Community', value: '1000+', icon: Share2 },
            ].map((stat, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center">
                <stat.icon className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// --- Daily Schedule ---
function ScheduleSection() {
  const schedule = [
    { day: 1, title: 'Arrays & Complexity', icon: Layers, desc: 'Master two pointers, sliding window, and prefix sums.' },
    { day: 2, title: 'Strings & Hashing', icon: BookOpen, desc: 'Anagrams, palindromes, and fast lookups using Hash Maps.' },
    { day: 3, title: 'Linked Lists', icon: Share2, desc: 'Pointer manipulation, tortoise & hare algorithms, and reversals.' },
    { day: 4, title: 'Stacks & Queues', icon: Database, desc: 'Monotonic stacks, valid parentheses, and queue simulations.' },
    { day: 5, title: 'Trees & BST', icon: Share2, desc: 'DFS, BFS traversals, lowest common ancestor, and path sums.' },
    { day: 6, title: 'Graphs', icon: Target, desc: 'Graph representations, shortest paths, and topological sorts.' },
    { day: 7, title: 'Mixed Contest + Finale', icon: Trophy, desc: 'A grand finale covering all topics to test your real-world readiness.' },
  ];

  return (
    <section className="py-20 border-b border-slate-800/40 bg-slate-900/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16" direction="up">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Daily Schedule</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">A structured path designed to cover the most heavily tested topics in technical interviews.</p>
        </AnimatedSection>

        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
          {schedule.map((item, idx) => (
            <AnimatedSection key={item.day} delay={idx * 0.1} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-emerald-500 bg-slate-950 text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {item.day}
              </div>
              <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-6 bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <item.icon className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Prize Pool ---
function PrizeSection() {
  return (
    <section className="py-20 border-b border-slate-800/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection direction="up" className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Prize Pool & Rewards</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Top performers on the HackerRank leaderboard will receive exclusive rewards.</p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <AnimatedSection delay={0.2} direction="up" className="md:mt-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Medal className="w-24 h-24" /></div>
              <div className="w-16 h-16 bg-slate-800 text-slate-300 rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 mx-auto">2nd</div>
              <h3 className="text-xl font-bold text-white mb-2">Runner Up</h3>
              <ul className="text-slate-400 text-sm space-y-2 mt-6">
                <li>CampusCoder Premium Merch</li>
                <li>Featured on Showcase</li>
                <li>Certificate of Excellence</li>
              </ul>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={0.1} direction="up">
            <div className="bg-gradient-to-b from-emerald-500/10 to-slate-900/50 border border-emerald-500/30 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="w-32 h-32" /></div>
              <Badge variant="accent" className="absolute top-4 right-4">Grand Prize</Badge>
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6 mx-auto">1st</div>
              <h3 className="text-2xl font-bold text-white mb-2">Champion</h3>
              <ul className="text-slate-300 text-sm space-y-3 mt-6 font-medium">
                <li className="flex items-center justify-center gap-2"><Star className="w-4 h-4 text-emerald-400" /> LeetCode Premium (1 Yr)</li>
                <li className="flex items-center justify-center gap-2"><Star className="w-4 h-4 text-emerald-400" /> Exclusive Hoodie</li>
                <li className="flex items-center justify-center gap-2"><Star className="w-4 h-4 text-emerald-400" /> Winner Certificate</li>
              </ul>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.3} direction="up" className="md:mt-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Award className="w-24 h-24" /></div>
              <div className="w-16 h-16 bg-slate-800 text-slate-300 rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 mx-auto">3rd</div>
              <h3 className="text-xl font-bold text-white mb-2">Second Runner Up</h3>
              <ul className="text-slate-400 text-sm space-y-2 mt-6">
                <li>CampusCoder T-Shirt</li>
                <li>Shoutout on Socials</li>
                <li>Certificate of Excellence</li>
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

// --- Benefits ---
function BenefitsSection() {
  const benefits = [
    "Build a habit of daily coding and problem solving",
    "Experience real technical interview pressure",
    "Gain deep insights into time and space complexities",
    "Add a verifiable achievement to your resume",
    "Network with hundreds of ambitious student developers",
    "Receive a certificate of participation upon completion"
  ];

  return (
    <section className="py-20 border-b border-slate-800/40 bg-slate-900/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection direction="up" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">More than just coding</h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              This challenge isn't just about writing code that works. It's about writing code that is clean, optimal, and interview-ready.
            </p>
            <div className="space-y-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
                  <p className="text-slate-300">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-gradient-to-tr from-emerald-500/20 to-slate-800/50 rounded-full blur-3xl absolute inset-0" />
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Students collaborating" 
              className="rounded-2xl border border-slate-800 relative z-10 opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-500"
            />
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// --- FAQ ---
function FAQSection() {
  const faqs = [
    { q: "Is the event free?", a: "Yes, the 7 Days DSA Challenge is 100% free for all students." },
    { q: "Where will the contests be hosted?", a: "The daily contests will be hosted on HackerRank. Links will be shared via our community Discord and email." },
    { q: "What programming languages are allowed?", a: "HackerRank supports over 40 languages including C++, Java, Python, and JavaScript. You can use whichever language you are comfortable with." },
    { q: "Do I need prior DSA knowledge?", a: "Basic programming knowledge is required. While we cover topics from scratch, prior exposure to arrays and loops is highly recommended." },
  ];

  return (
    <section className="py-20 border-b border-slate-800/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-12" direction="up">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        </AnimatedSection>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <AnimatedSection key={idx} delay={idx * 0.1} direction="up">
              <Card className="p-6 bg-slate-900/30 border-slate-800">
                <div className="flex gap-4">
                  <HelpCircle className="h-6 w-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">{faq.q}</h4>
                    <p className="text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Contact ---
function ContactSection() {
  return (
    <section className="py-20 border-b border-slate-800/40 bg-slate-900/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection direction="up">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Have more questions?</h2>
          <p className="text-slate-400 mb-8">Reach out to the organizing team or ask the community.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="mailto:admin@campuscoder.com">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-slate-300">
                <Mail className="w-5 h-5 mr-2" /> Email Us
              </Button>
            </a>
            <a href="https://discord.gg/VdsX64E5E" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                <MessageSquare className="w-5 h-5 mr-2" /> Ask on Discord
              </Button>
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// --- CTA ---
function CTASection() {
  return (
    <section id="register" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-950/20 pointer-events-none" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <AnimatedSection direction="up" className="bg-slate-900/80 border border-slate-800 backdrop-blur-sm rounded-3xl p-10 md:p-16 shadow-2xl">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Ready to take the challenge?</h2>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
            Spots are filling up fast. Register now to secure your place in the 7 Days DSA Challenge 2026.
          </p>
          <Link href="/register">
            <Button variant="primary" size="lg" className="h-14 px-12 text-lg font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all">
              Register Now
            </Button>
          </Link>
          <p className="mt-6 text-sm text-slate-500 font-mono uppercase tracking-widest">Starts June 22, 2026</p>
        </AnimatedSection>
      </div>
    </section>
  );
}

export default function DSAChallengePageClient() {
  return (
    <main className="min-h-screen bg-slate-950">
      <LandingHero />
      <DSA3DShowcase />
      <AboutSection />
      <ScheduleSection />
      <PrizeSection />
      <BenefitsSection />
      <FAQSection />
      <ContactSection />
      <CTASection />
    </main>
  );
}
