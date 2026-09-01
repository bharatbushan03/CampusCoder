'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, Globe, Code, MessageSquare, Users, Trophy, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from './ui/Button';

type CommunityLink = {
  platform: string;
  url: string;
};

const fallbackLinks: CommunityLink[] = [
  { platform: 'Discord', url: 'https://discord.gg/VdsX64E5E' },
  { platform: 'WhatsApp', url: 'https://chat.whatsapp.com/KLOHfAjbu91IP5C9SqPnP2' },
  { platform: 'GitHub', url: 'https://github.com/bharatbushan03/campuscoder' },
];

const copyrightYear = new Date().getFullYear();

function getPlatformIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p.includes('discord')) return <MessageSquare className="size-4" />;
  if (p.includes('whatsapp')) return <Phone className="size-4" />;
  if (p.includes('linkedin')) return <Users className="size-4" />;
  if (p.includes('github')) return <Terminal className="size-4" />;
  if (p.includes('hackerrank')) return <Trophy className="size-4" />;
  return <Globe className="size-4" />;
}

export const Footer: React.FC = React.memo(function Footer() {
  const [links, setLinks] = useState<CommunityLink[]>(fallbackLinks);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const data = await api<{ ok: boolean; links: CommunityLink[] }>('/events/community-links');
        setLinks(data.links && data.links.length > 0 ? data.links : fallbackLinks);
      } catch (err) {
        console.warn('Footer links fetch failed:', err);
        setLinks(fallbackLinks);
      }
    };
    fetchLinks();
  }, []);

  return (
    <footer className="relative z-10 bg-[#080b11] border-t border-white/[0.08] pt-16 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/25 group-hover:border-emerald-500/50 transition-all">
                <Terminal className="size-4 text-emerald-400" />
              </div>
              <span className="font-mono text-lg font-bold tracking-tight text-white">
                Campus<span className="text-emerald-400 font-sans font-semibold">Coder</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              A student-run engineering community organizing competitive DSA sprints, systems workshops, and placement peer reviews.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {links.map((link) => (
                <a 
                  key={link.platform} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="size-8 rounded-lg bg-[#0e1422] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:border-white/[0.2] transition-all"
                  title={link.platform}
                >
                  {getPlatformIcon(link.platform)}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Navigation</h4>
            <ul className="space-y-2.5">
              {['Home', 'Events', 'Workshops', 'Resources', 'About', 'Archive'].map((item) => (
                <li key={item}>
                  <Link 
                    href={item === 'Home' ? '/' : (item === 'Archive' ? '/events/archive' : `/${item.toLowerCase()}`)} 
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sprints & Support */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Support & Hubs</h4>
            <ul className="space-y-2.5">
              {['Admin Console', 'Student Dashboard', 'Discord Server', 'Code of Conduct'].map((item) => (
                <li key={item}>
                  <Link 
                    href={item === 'Discord Server' ? 'https://discord.gg/VdsX64E5E' : (item === 'Admin Console' ? '/admin' : (item === 'Student Dashboard' ? '/dashboard' : '/about'))} 
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Operational Status */}
          <div className="space-y-4 lg:col-span-1">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">System Telemetry</h4>
            <div className="p-4 rounded-xl bg-[#0e1422] border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-mono font-semibold text-slate-200">SPRINT NODES ACTIVE</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Weekly problem sets and peer mock rooms are currently in session.
              </p>
              <div className="pt-1">
                <Link href="/events">
                  <Button variant="primary" size="sm" className="w-full text-xs">Join Next Sprint</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.07] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 font-mono">
            &copy; {copyrightYear} CampusCoder. Open community for student engineers.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-500 font-mono">
            <Link href="/privacy" className="transition-colors hover:text-slate-300">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-slate-300">
              Terms
            </Link>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.02] text-slate-400 text-[10px]">
              <Code className="size-3 text-emerald-400" /> by students, for students
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
});


