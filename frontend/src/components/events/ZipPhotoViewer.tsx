'use client';

import React from 'react';
import { ExternalLink, HardDrive } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ZipPhotoViewerProps {
  photos?: string[];
  photosZipUrl?: string | null;
  photosDriveUrl?: string | null;
  eventTitle: string;
  className?: string;
}

export function ZipPhotoViewer({
  photos: _photos = [],
  photosZipUrl: _photosZipUrl,
  photosDriveUrl,
  eventTitle: _eventTitle,
  className = '',
}: ZipPhotoViewerProps) {
  // If there's a Google Drive URL, just show a link to it
  if (photosDriveUrl) {
    return (
      <Card
        hoverEffect={false}
        className={`p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-xl ${className}`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10 shrink-0">
              <HardDrive className="size-7" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold flex items-center gap-1">
                <HardDrive className="size-3" /> Google Drive Connected
              </span>
              <h3 className="text-lg font-bold text-white font-mono mt-1.5 flex items-center gap-2">
                Event Media &amp; Photos
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Photos and videos are hosted in Google Drive. Click below to view them directly.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <a
              href={photosDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer py-2.5 px-5"
              >
                <ExternalLink className="size-4" />
                <span>View Photos &amp; Videos on Drive</span>
              </Button>
            </a>
          </div>
        </div>
      </Card>
    );
  }

  // If no Google Drive URL, show a simple message
  return (
    <Card
      hoverEffect={false}
      className={`p-6 bg-slate-900/80 border border-slate-800 ${className}`}
    >
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 shrink-0">
            <HardDrive className="size-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-mono">
              Event Media &amp; Photos
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              No Google Drive link available for this event.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}