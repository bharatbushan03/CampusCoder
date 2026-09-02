'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Archive, 
  Maximize2, 
  Minimize2,
  Camera,
  Loader2
} from 'lucide-react';
import { downloadSinglePhoto, downloadEventPhotosZip } from '@/lib/downloadZip';

interface EventPhotoLightboxProps {
  photos: string[];
  eventTitle: string;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function EventPhotoLightbox({
  photos,
  eventTitle,
  initialIndex = 0,
  isOpen,
  onClose,
}: EventPhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [isImgLoading, setIsImgLoading] = useState(true);

  // Sync initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsImgLoading(true);
    }
  }, [isOpen, initialIndex]);

  const handlePrev = useCallback(() => {
    setIsImgLoading(true);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setIsImgLoading(true);
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const safeSlug = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'event';
  const currentPhotoName = `${safeSlug}-photo-${currentIndex + 1}.jpg`;

  const handleDownloadSingle = () => {
    void downloadSinglePhoto(currentPhoto, currentPhotoName);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    setZipProgress(0);
    try {
      await downloadEventPhotosZip(photos, eventTitle, (p) => setZipProgress(p));
    } finally {
      setIsZipping(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
        {/* TOP HEADER CONTROLS */}
        <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* Left: Event Info & Counter */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Camera className="size-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                {eventTitle}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Photo <span className="text-emerald-400 font-bold">{currentIndex + 1}</span> of {photos.length}
              </p>
            </div>
          </div>

          {/* Right: Actions (Download Single, Download ZIP, Fullscreen, Close) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Download Single Photo Button */}
            <button
              onClick={handleDownloadSingle}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-mono text-xs font-semibold transition-all cursor-pointer"
              title="Download this photo"
            >
              <Download className="size-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Download Photo</span>
            </button>

            {/* Download All ZIP Button */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              title={`Download all ${photos.length} photos as ZIP`}
            >
              {isZipping ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span className="hidden sm:inline">{zipProgress}% Zipping...</span>
                </>
              ) : (
                <>
                  <Archive className="size-3.5" />
                  <span className="hidden sm:inline">Download ZIP ({photos.length})</span>
                </>
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>

            {/* Close Lightbox */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 transition-all cursor-pointer"
              title="Close (Esc)"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* PREVIOUS BUTTON */}
        {photos.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 z-40 p-3 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/10 hover:border-emerald-500/40 text-white/80 hover:text-emerald-400 transition-all shadow-xl hover:scale-110 cursor-pointer"
            title="Previous Photo (Left Arrow)"
          >
            <ChevronLeft className="size-6 sm:size-8" />
          </button>
        )}

        {/* MAIN PHOTO DISPLAY */}
        <div className="relative w-full h-[75vh] max-w-6xl mx-auto px-4 sm:px-16 flex items-center justify-center select-none">
          {isImgLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="size-10 text-emerald-400 animate-spin" />
            </div>
          )}

          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="relative w-full h-full max-h-[75vh] flex items-center justify-center"
          >
            <Image
              src={currentPhoto}
              alt={`${eventTitle} - Photo ${currentIndex + 1}`}
              fill
              unoptimized
              className="object-contain rounded-xl drop-shadow-2xl"
              onLoadingComplete={() => setIsImgLoading(false)}
            />
          </motion.div>
        </div>

        {/* NEXT BUTTON */}
        {photos.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-3 sm:right-6 z-40 p-3 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/10 hover:border-emerald-500/40 text-white/80 hover:text-emerald-400 transition-all shadow-xl hover:scale-110 cursor-pointer"
            title="Next Photo (Right Arrow)"
          >
            <ChevronRight className="size-6 sm:size-8" />
          </button>
        )}

        {/* BOTTOM THUMBNAIL STRIP */}
        {photos.length > 1 && (
          <div className="absolute bottom-0 inset-x-0 z-50 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 scrollbar-thin scrollbar-thumb-white/20">
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsImgLoading(true);
                    setCurrentIndex(idx);
                  }}
                  className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    currentIndex === idx
                      ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/30'
                      : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white/40'
                  }`}
                >
                  <Image
                    src={p}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
