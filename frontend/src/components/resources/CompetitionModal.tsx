'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  Trophy, 
  Users, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  BookOpen, 
  Clock, 
  Share2, 
  Check, 
  Target,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { CompetitionItem } from '@/data/competitionsData';
import { CountdownTimer } from '@/components/ui/CountdownTimer';

interface CompetitionModalProps {
  competition: CompetitionItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CompetitionModal({ competition, isOpen, onClose }: CompetitionModalProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'prep' | 'checklist'>('timeline');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // Load saved checklist state for this competition
  useEffect(() => {
    if (competition) {
      const saved = localStorage.getItem(`cc_checklist_${competition.id}`);
      if (saved) {
        try {
          setCheckedItems(JSON.parse(saved));
        } catch {
          setCheckedItems({});
        }
      } else {
        setCheckedItems({});
      }
    }
  }, [competition]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !competition) return null;

  const toggleChecklist = (index: number) => {
    const key = `item_${index}`;
    const newState = { ...checkedItems, [key]: !checkedItems[key] };
    setCheckedItems(newState);
    if (competition) {
      localStorage.setItem(`cc_checklist_${competition.id}`, JSON.stringify(newState));
    }
  };

  const completedCount = competition.checklist.filter((_, idx) => checkedItems[`item_${idx}`]).length;
  const progressPercent = Math.round((completedCount / competition.checklist.length) * 100);

  const generateGoogleCalendarUrl = () => {
    const title = encodeURIComponent(competition.title);
    const details = encodeURIComponent(`${competition.subtitle}\n\nPlatform: ${competition.platform}\nPrize Pool: ${competition.prizePool}\nLink: ${competition.platformUrl}`);
    const location = encodeURIComponent(competition.mode === 'Online' ? 'Online / Virtual' : 'Onsite / In-Person');
    
    // Default to target date or 1 day event
    const startIso = new Date(competition.targetDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endIso = new Date(new Date(competition.targetDate).getTime() + 3600000 * 2).toISOString().replace(/-|:|\.\d\d\d/g, '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startIso}/${endIso}`;
  };

  const handleShare = async () => {
    const textToCopy = `${competition.title} - ${competition.subtitle}\nCheck it out on CampusCoder Resources: ${window.location.origin}/resources?category=competitions`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // fallback
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden z-10 my-auto"
        >
          {/* Header Ambient Glow */}
          <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b ${competition.bannerGradient} pointer-events-none opacity-40 blur-2xl`} />

          {/* Top Bar */}
          <div className="relative px-6 pt-6 pb-4 border-b border-slate-800/80 flex items-start justify-between gap-4">
            <div className="space-y-1.5 pr-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  {competition.platform}
                </span>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                  {competition.difficulty}
                </span>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                  {competition.mode}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight leading-tight">
                {competition.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {competition.subtitle}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors shrink-0"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" /> Prize Pool
                </div>
                <div className="text-xs font-bold text-white leading-snug">
                  {competition.prizePool}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
                  <Users className="h-3.5 w-3.5 text-cyan-400" /> Team Size
                </div>
                <div className="text-xs font-bold text-white leading-snug">
                  {competition.teamSize}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" /> Status
                </div>
                <div className={`text-xs font-bold leading-snug ${
                  competition.status === 'Concluded' ? 'text-slate-400' : 'text-emerald-400'
                }`}>
                  {competition.status}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
                  <Calendar className="h-3.5 w-3.5 text-purple-400" /> {competition.status === 'Concluded' ? 'Concluded' : 'Deadline'}
                </div>
                <div className="text-xs font-bold text-slate-200 leading-snug truncate" title={competition.concludedDate || competition.deadlineDate}>
                  {competition.concludedDate || competition.deadlineDate}
                </div>
              </div>
            </div>

            {/* Countdown or Concluded Box */}
            {competition.status === 'Concluded' ? (
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 uppercase">
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" /> Event Concluded
                  </div>
                  <p className="text-xs text-slate-400">
                    This arena concluded on {competition.concludedDate || competition.deadlineDate}. Past challenge materials, solutions, and prep kits remain accessible.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-r from-emerald-950/30 via-slate-900/50 to-slate-900/30 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 uppercase">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Live Countdown
                  </div>
                  <p className="text-xs text-slate-400">
                    Target event / registration close window
                  </p>
                </div>

                <CountdownTimer targetDate={new Date(competition.targetDate)} className="scale-90 sm:scale-100" />
              </div>
            )}

            {/* Perks & Eligibility */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Key Perks & Rewards
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {competition.perks.map((perk, index) => (
                  <div key={index} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                <strong className="text-slate-300">Eligibility:</strong> {competition.eligibility}
              </p>
            </div>

            {/* Interactive Section Tabs */}
            <div className="space-y-4">
              <div className="flex border-b border-slate-800 gap-2 pb-1">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-2 ${
                    activeTab === 'timeline'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" /> Stages & Timeline
                </button>

                <button
                  onClick={() => setActiveTab('prep')}
                  className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-2 ${
                    activeTab === 'prep'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" /> Preparation Kit
                </button>

                <button
                  onClick={() => setActiveTab('checklist')}
                  className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-2 ${
                    activeTab === 'checklist'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Target className="h-3.5 w-3.5" /> Readiness Checklist ({completedCount}/{competition.checklist.length})
                </button>
              </div>

              {/* Tab: Timeline */}
              {activeTab === 'timeline' && (
                <div className="space-y-3 pt-2">
                  {competition.timeline.map((step, idx) => (
                    <div
                      key={idx}
                      className={`relative pl-6 pb-4 border-l ${
                        step.isActive ? 'border-emerald-500' : 'border-slate-800'
                      } last:border-l-transparent last:pb-0`}
                    >
                      <div
                        className={`absolute -left-2 top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          step.isActive
                            ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                            : 'bg-slate-950 border-slate-700'
                        }`}
                      >
                        {step.isActive && <div className="h-1.5 w-1.5 bg-slate-950 rounded-full" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-white">{step.stage}</h4>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {step.date}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Prep Kit */}
              {activeTab === 'prep' && (
                <div className="space-y-3 pt-2">
                  {competition.prepKit.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all hover:bg-slate-900/80"
                    >
                      <div className="space-y-1 pr-4">
                        <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                          {item.title}
                          <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                        <p className="text-xs text-slate-400">{item.description}</p>
                      </div>
                      <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg shrink-0">
                        Open
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {/* Tab: Checklist */}
              {activeTab === 'checklist' && (
                <div className="space-y-4 pt-2">
                  {/* Progress Bar */}
                  <div className="space-y-1.5 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Your Preparedness</span>
                      <span className="text-emerald-400 font-bold">{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {competition.checklist.map((item, idx) => {
                      const isChecked = !!checkedItems[`item_${idx}`];
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleChecklist(idx)}
                          className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-200'
                              : 'bg-slate-900/30 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          {isChecked ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
                          )}
                          <span className={`text-xs leading-relaxed ${isChecked ? 'line-through text-slate-400' : ''}`}>
                            {item}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <a
                href={generateGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-mono font-medium transition-colors"
                title="Add to Google Calendar"
              >
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Add to Calendar</span>
              </a>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-mono font-medium transition-colors cursor-pointer"
                title="Copy share link"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5 text-slate-400" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>

              <a
                href={competition.platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Go to Portal
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
