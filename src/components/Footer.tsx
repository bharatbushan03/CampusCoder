'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, Globe, Code, MessageSquare, Users, Trophy, Phone } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Button } from './ui/Button';

export const Footer: React.FC = () => {
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from('community_links')
          .select('*')
          .eq('is_active', true);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setLinks(data);
        } else {
          setLinks([
            { platform: 'Discord', url: 'https://discord.gg/campuscoder' },
            { platform: 'WhatsApp', url: 'https://chat.whatsapp.com/campuscoder' },
            { platform: 'GitHub', url: 'https://github.com/campuscoder-org' }
          ]);
        }
      } catch (err) {
        console.warn('Footer links fetch bypassed or offline:', err);
        setLinks([
          { platform: 'Discord', url: 'https://discord.gg/campuscoder' },
          { platform: 'WhatsApp', url: 'https://chat.whatsapp.com/campuscoder' },
          { platform: 'GitHub', url: 'https://github.com/campuscoder-org' }
        ]);
      }
    };
    fetchLinks();
  }, []);

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('discord')) return <MessageSquare className="h-5 w-5" />;
    if (p.includes('whatsapp')) return <Phone className="h-5 w-5" />;
    if (p.includes('linkedin')) return <Users className="h-5 w-5" />;
    if (p.includes('github')) return <Terminal className="h-5 w-5" />;
    if (p.includes('hackerrank')) return <Trophy className="h-5 w-5" />;
    return <Globe className="h-5 w-5" />;
  };

  return (
    <footer className="relative z-10 bg-slate-950 border-t border-slate-900 pt-20 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="space-y-6 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:border-emerald-500/50 transition-all">
                <Terminal className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="font-mono text-xl font-bold tracking-tight text-white">
                Campus<span className="text-emerald-500 font-sans">Coder</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering the next generation of student developers through hands-on technical workshops and collaborative learning ecosystems.
            </p>
            <div className="flex items-center gap-3">
              {links.map((link) => (
                <a 
                  key={link.platform} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                  title={link.platform}
                >
                  {getPlatformIcon(link.platform)}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Navigation</h4>
            <ul className="space-y-4">
              {['Home', 'Events', 'Workshops', 'Resources', 'Archive'].map((item) => (
                <li key={item}>
                  <Link 
                    href={item === 'Home' ? '/' : (item === 'Archive' ? '/events/archive' : `/${item.toLowerCase()}`)} 
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sprints & Support */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Support</h4>
            <ul className="space-y-4">
              {['Admin Console', 'Student Dashboard', 'Discord Server', 'Code of Conduct', 'Contact Us'].map((item) => (
                <li key={item}>
                  <Link 
                    href={item === 'Discord Server' ? 'https://discord.gg/campuscoder' : (item === 'Admin Console' ? '/admin' : (item === 'Student Dashboard' ? '/dashboard' : '/'))} 
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter/Status */}
          <div className="space-y-6 lg:col-span-1">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Live Status</h4>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/60 space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-medium text-slate-300">Hub is Operational</span>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 leading-tight">
                  Join 500+ active coders. All services currently running smoothly.
                </p>
                <div className="pt-2">
                  <Link href="/register">
                    <Button variant="primary" size="sm" className="w-full text-[10px] h-9">Join Community</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 font-mono">
            &copy; {new Date().getFullYear()} CampusCoder Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <a href="#" className="hover:text-emerald-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Terms</a>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-500/80">
              <Code className="h-3 w-3" /> built for builders
            </span>
          </div>
        </div>
      </div>
      
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
    </footer>
  );
};
