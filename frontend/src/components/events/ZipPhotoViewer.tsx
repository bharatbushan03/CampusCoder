'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Download, Image as ImageIcon, Video, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { downloadEventMediaZip, downloadSingleMedia } from '@/lib/downloadZip';

interface ZipPhotoViewerProps {
  photos?: string[];
  videos?: string[];
  photosZipUrl?: string | null;
  eventTitle: string;
  className?: string;
}

export function ZipPhotoViewer({
  photos = [],
  videos = [],
  photosZipUrl,
  eventTitle,
  className = '',
}: ZipPhotoViewerProps) {
  const media = [
    ...photos.map((url) => ({ url, type: 'photo' as const })),
    ...videos.map((url) => ({ url, type: 'video' as const })),
  ];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeMedia = activeIndex === null ? null : media[activeIndex];

  const showPrevious = () => {
    if (!media.length) return;
    setActiveIndex((current) => (current === null ? 0 : (current - 1 + media.length) % media.length));
  };

  const showNext = () => {
    if (!media.length) return;
    setActiveIndex((current) => (current === null ? 0 : (current + 1) % media.length));
  };

  useEffect(() => {
    if (activeIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowLeft') showPrevious();
      if (event.key === 'ArrowRight') showNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeIndex]);

  return (
    <>
      <Card hoverEffect={false} className={`p-6 bg-slate-900/80 border border-slate-800 ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-bold text-white font-mono">Event Photos &amp; Videos</h3>
          <p className="text-xs text-slate-400 mt-1">Uploaded media is available to view and download.</p>
        </div>
        <div className="flex items-center gap-2">
          {photosZipUrl && <a href={photosZipUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><Download className="size-3.5 mr-1.5" /> ZIP</Button></a>}
          {(photos.length > 0 || videos.length > 0) && <Button variant="primary" size="sm" onClick={() => downloadEventMediaZip(photos, videos, eventTitle)}><Download className="size-3.5 mr-1.5" /> Download all</Button>}
        </div>
      </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {media.map((item, index) => (
            <button key={`${item.type}-${item.url}-${index}`} type="button" onClick={() => setActiveIndex(index)} className="group relative aspect-video overflow-hidden rounded-lg border border-slate-800 bg-slate-950 text-left cursor-pointer">
              {item.type === 'photo' ? <Image src={item.url} alt={`Event photo ${index + 1}`} fill unoptimized className="object-cover transition-transform group-hover:scale-105" /> : <video src={item.url} preload="metadata" muted className="h-full w-full object-cover" />}
              <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-[10px] text-white">{item.type === 'photo' ? <ImageIcon className="size-3" /> : <Video className="size-3" />} {item.type === 'photo' ? 'Photo' : 'Video'}</span>
            </button>
          ))}
        </div>
      </Card>

      {activeMedia && activeIndex !== null && typeof document !== 'undefined' && createPortal(
        <div role="dialog" aria-modal="true" aria-label={`${activeMedia.type} ${activeIndex + 1} of ${media.length}`} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-8" onClick={() => setActiveIndex(null)}>
          <button type="button" onClick={() => setActiveIndex(null)} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Close slideshow"><X className="size-5" /></button>
          <button type="button" onClick={(event) => { event.stopPropagation(); showPrevious(); }} className="absolute left-3 sm:left-8 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Previous media"><ChevronLeft className="size-7" /></button>
          <div className="flex max-h-full max-w-6xl flex-col items-center gap-4" onClick={(event) => event.stopPropagation()}>
            {activeMedia.type === 'photo' ? <div className="relative h-[78vh] w-[min(90vw,72rem)]"><Image src={activeMedia.url} alt={`Event photo ${activeIndex + 1}`} fill unoptimized className="object-contain" /></div> : <video src={activeMedia.url} controls autoPlay className="max-h-[78vh] max-w-[90vw]" />}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-300">{activeIndex + 1} / {media.length}</span>
              <Button type="button" variant="primary" size="sm" onClick={() => downloadSingleMedia(activeMedia.url, `${eventTitle}-${activeMedia.type}-${activeIndex + 1}`)}><Download className="size-3.5 mr-1.5" /> Download this {activeMedia.type}</Button>
            </div>
          </div>
          <button type="button" onClick={(event) => { event.stopPropagation(); showNext(); }} className="absolute right-3 sm:right-8 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Next media"><ChevronRight className="size-7" /></button>
        </div>,
        document.body,
      )}
    </>
  );
}