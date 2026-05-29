'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, Globe, Code, MessageSquare, Users, Trophy, Phone } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

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
    if (p.includes('whatsapp')) return <Phone className="h-5 w-5 text-emerald-400" />;
    if (p.includes('linkedin')) return <Users className="h-5 w-5" />;
    if (p.includes('github')) return <Terminal className="h-5 w-5" />;
    if (p.includes('hackerrank')) return <Trophy className="h-5 w-5 text-amber-400" />;
    return <Globe className="h-5 w-5" />;
  };

  return (
    <footer className="w-full border-t border-emerald-500/10 bg-slate-950 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <Terminal className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="font-mono text-lg font-bold tracking-tight text-white">
                Campus<span className="text-emerald-500 font-sans">Coder</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm mb-4 leading-relaxed">
              A student-led virtual coding community designed to bridge the gap between academics, modern software craftsmanship, and competitive career opportunities.
            </p>
            <div className="flex gap-4">
              {links.map((link) => (
                <a
                  key={link.id || link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-emerald-400 transition-colors"
                  aria-label={link.platform}
                  title={link.platform}
                >
                  {getPlatformIcon(link.platform)}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  Registration Portal
                </Link>
              </li>
              {links.map((link) => (
                <li key={`menu-${link.id || link.platform}`}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1 capitalize"
                  >
                    {link.platform} channel
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Developer / Admin */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  Member Portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  System Design Guide
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} CampusCoder Community. All rights reserved.
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            Made with <Code className="h-3.5 w-3.5 text-emerald-500" /> for student builders.
          </p>
        </div>
      </div>
    </footer>
  );
};
