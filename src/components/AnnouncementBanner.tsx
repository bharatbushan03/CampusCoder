'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export const AnnouncementBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchLatestAnnouncement = async () => {
      try {
        const supabase = createClient() as any;
        const nowStr = new Date().toISOString();

        // Fetch latest active announcement where publish_date is in the past
        const { data, error } = await supabase
          .from('announcements')
          .select(`
            *,
            events (
              title,
              slug
            )
          `)
          .eq('is_active', true)
          .lte('publish_date', nowStr)
          .order('publish_date', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const latest = data[0];
          // Check if dismissed in localStorage
          const dismissedId = localStorage.getItem('dismissed_announcement_id');
          if (dismissedId !== latest.id) {
            setAnnouncement(latest);
            setVisible(true);
          }
        }
      } catch (err) {
        console.warn('Announcement banner fetch bypassed or database offline:', err);
        // Fallback for preview/local mode
        const dismissedId = localStorage.getItem('dismissed_announcement_id');
        if (dismissedId !== 'demo-announcement') {
          setAnnouncement({
            id: 'demo-announcement',
            title: 'Welcome to CampusCoder!',
            message: 'Our brand new community console is now live. Check out upcoming sprints!',
            event_id: null,
            events: null
          });
          setVisible(true);
        }
      }
    };

    fetchLatestAnnouncement();
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem('dismissed_announcement_id', announcement.id);
    }
    setVisible(false);
  };

  if (!visible || !announcement) return null;

  return (
    <div className="w-full bg-emerald-500/10 border-b border-emerald-500/20 backdrop-blur-sm relative z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-500/20">
            <Megaphone className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />
          </span>
          <p className="text-xs text-slate-300 truncate">
            <span className="font-semibold text-emerald-400 font-mono mr-1.5">[{announcement.title}]</span>
            {announcement.message}
          </p>
          {announcement.events && (
            <Link 
              href={`/events/${announcement.events.slug}`}
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 shrink-0 ml-2 font-mono"
            >
              Details <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        <button 
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-emerald-500/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Dismiss announcement"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
