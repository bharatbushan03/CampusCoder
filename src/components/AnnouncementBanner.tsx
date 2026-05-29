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
          const dismissedId = localStorage.getItem('dismissed_announcement_id');
          if (dismissedId !== latest.id) {
            setAnnouncement(latest);
            setVisible(true);
          }
        }
      } catch (err) {
        console.warn('Announcement banner fetch error:', err);
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
    <div className="sticky top-0 z-[60] w-full">
      <div className="bg-emerald-500/10 backdrop-blur-md border-b border-emerald-500/20 px-4 py-2.5 shadow-2xl overflow-hidden relative group">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Megaphone className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="text-xs md:text-sm font-medium text-slate-200 truncate pr-4 leading-none">
              <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] mr-3 border border-emerald-500/30 px-1.5 py-0.5 rounded bg-emerald-500/5 font-mono hidden sm:inline-block">Alert</span>
              {announcement.title}: <span className="text-slate-400 font-normal">{announcement.message}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            {announcement.events && (
              <Link 
                href={`/events/${announcement.events.slug}`}
                className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold font-mono uppercase tracking-widest text-emerald-400 hover:text-white transition-all group/btn"
              >
                Learn More <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
              </Link>
            )}
            
            <button
              onClick={handleDismiss}
              className="h-7 w-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors group/x cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5 group-hover/x:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>
        
        {/* Progress line decorative */}
        <div className="absolute bottom-0 left-0 h-[1px] bg-emerald-500/40 w-full animate-pulse"></div>
      </div>
    </div>
  );
};
