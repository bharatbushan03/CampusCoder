'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  Loader2
} from 'lucide-react';

export interface PdfViewerData {
  title: string;
  code?: string;
  pdfUrl: string;
  fileSize?: string;
  author?: string;
  semester?: string;
  year?: string;
}

interface PdfViewerModalProps {
  note: PdfViewerData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PdfViewerModal({ note, isOpen, onClose }: PdfViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setIframeLoading(true);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen || !note) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(note.pdfUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`relative w-full bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col z-10 overflow-hidden ${
            isFullscreen
              ? 'fixed inset-2 sm:inset-4 max-w-none max-h-none h-[calc(100vh-2rem)]'
              : 'max-w-6xl h-[88vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm flex items-center justify-between gap-4 shrink-0">
            {/* Title & Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {note.code && (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {note.code}
                    </span>
                  )}
                  {note.fileSize && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {note.fileSize}
                    </span>
                  )}
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white font-mono truncate" title={note.title}>
                  {note.title}
                </h2>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Direct Download Button */}
              <a
                href={note.pdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
                title="Download PDF"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download PDF</span>
              </a>

              {/* Open in New Tab */}
              <a
                href={note.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                title="Open PDF in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="hidden md:flex p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Viewer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Reader Area */}
          <div className="relative flex-1 bg-slate-950 w-full h-full overflow-hidden flex items-center justify-center">
            {iframeLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 space-y-3 pointer-events-none">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                <p className="text-xs font-mono text-slate-400">Loading interactive PDF document...</p>
              </div>
            )}

            <iframe
              src={`${note.pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
              title={note.title}
              onLoad={() => setIframeLoading(false)}
              className="w-full h-full border-none bg-slate-900"
            />
          </div>

          {/* Bottom Bar Info */}
          <div className="px-5 py-2.5 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>CampusCoder In-App PDF Reader & Study Desk</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                {copied ? '✓ PDF Link Copied' : 'Copy Direct Link'}
              </button>
              <span>•</span>
              <a
                href={note.pdfUrl}
                download
                className="text-emerald-400 hover:underline font-bold"
              >
                Save Locally
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
