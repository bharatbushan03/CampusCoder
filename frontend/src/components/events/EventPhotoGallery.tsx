'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Camera, 
  Download, 
  Archive, 
  Eye, 
  Loader2,
  Maximize2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EventPhotoLightbox } from './EventPhotoLightbox';
import { downloadSinglePhoto, downloadEventPhotosZip } from '@/lib/downloadZip';

interface EventPhotoGalleryProps {
  photos?: string[];
  eventTitle: string;
  className?: string;
}

export function EventPhotoGallery({
  photos = [],
  eventTitle,
  className = '',
}: EventPhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isZipping, setIsZipping] = useState(false);

  if (!photos || photos.length === 0) {
    return null;
  }

  const handleOpenLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
    setLightboxOpen(true);
  };

  const handleDownloadAll = async () => {
    setIsZipping(true);
    try {
      await downloadEventPhotosZip(photos, eventTitle);
    } finally {
      setIsZipping(false);
    }
  };

  const safeSlug = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'event';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* SECTION HEADER WITH ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Camera className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                Event Memories & Photos
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse session highlights, click to view full screen, or download high-res originals.
            </p>
          </div>
        </div>

        {/* Action Buttons: View Full Gallery & Download All ZIP */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenLightbox(0)}
            className="border-slate-700 text-xs font-mono text-slate-300 hover:text-white"
          >
            <Eye className="size-3.5 mr-1 text-cyan-400" />
            View Slideshow
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadAll}
            disabled={isZipping}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs shadow-md shadow-emerald-500/20"
          >
            {isZipping ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Packaging ZIP...
              </>
            ) : (
              <>
                <Archive className="size-3.5 mr-1.5" /> Download All (.ZIP)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* PHOTO GRID DISPLAY */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {photos.map((photoUrl, index) => {
          const photoName = `${safeSlug}-photo-${index + 1}.jpg`;

          return (
            <Card
              key={index}
              className="group relative aspect-4/3 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 p-0 cursor-pointer hover:border-emerald-500/40 transition-all shadow-md"
              onClick={() => handleOpenLightbox(index)}
            >
              {/* Photo Image */}
              <Image
                src={photoUrl}
                alt={`${eventTitle} Moment ${index + 1}`}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Dark Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                {/* Top: View badge */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[10px] font-mono text-white/90">
                    #{index + 1}
                  </span>
                  <div className="p-1.5 rounded-lg bg-black/60 border border-white/20 text-white">
                    <Maximize2 className="size-3.5 text-emerald-400" />
                  </div>
                </div>

                {/* Bottom: Quick Download Button */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-mono text-slate-200 truncate">
                    Click to view
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void downloadSinglePhoto(photoUrl, photoName);
                    }}
                    className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-sm hover:scale-110 cursor-pointer"
                    title="Download Photo"
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* LIGHTBOX MODAL */}
      <EventPhotoLightbox
        photos={photos}
        eventTitle={eventTitle}
        initialIndex={selectedPhotoIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
