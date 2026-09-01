'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type AnnouncementRow = {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  publish_date: string;
  event_id: string | null;
};
type EventSummary = { title: string; slug: string };
type AnnouncementWithEvent = AnnouncementRow & { events?: EventSummary | null };
type LatestAnnouncementResponse = { announcement: AnnouncementWithEvent | null };

export const AnnouncementBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<AnnouncementWithEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchLatestAnnouncement = async () => {
      try {
        const response = await fetch('/api/events/announcements/latest', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const { announcement: latest } = (await response.json()) as LatestAnnouncementResponse;
        if (latest) {
          const dismissedId = localStorage.getItem('dismissed_announcement_id');
          if (dismissedId !== latest.id) {
            setAnnouncement(latest);
            setVisible(true);
          }
        }
      } catch {
        // Banner unavailable — silently degrade
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
      <div className="bg-[#0e1422] border-b border-white/[0.08] px-4 py-2 shadow-lg overflow-hidden relative group">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-2.5 overflow-hidden flex-1">
            <span className="flex-shrink-0 size-6 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Megaphone className="size-3 text-emerald-400" />
            </span>
            <p className="text-xs font-medium text-slate-200 truncate pr-4">
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[9px] mr-2 border border-emerald-500/30 px-1.5 py-0.5 rounded bg-emerald-500/5 font-mono hidden sm:inline-block">Alert</span>
              <strong className="text-white">{announcement.title}:</strong> <span className="text-slate-400 font-normal">{announcement.message}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            {announcement.events && (
              <Link 
                href={`/events/${announcement.events.slug}`}
                className="hidden sm:flex items-center gap-1 text-[10px] font-bold font-mono uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Learn More <ArrowRight className="size-3" />
              </Link>
            )}
            
            <button type="button"
              onClick={handleDismiss}
              className="size-6 rounded hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

