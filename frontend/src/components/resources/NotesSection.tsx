'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  GraduationCap, 
  FileText, 
  Video, 
  Download, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Layers, 
  BookmarkCheck
} from 'lucide-react';
import { notesData, YearLevel, SemesterLevel } from '@/data/notesData';
import { AnimatedCard } from '@/components/animations/ScrollAnimations';

interface NotesSectionProps {
  initialYear?: YearLevel;
  initialSearch?: string;
}

export function NotesSection({ initialYear = '1st-year', initialSearch = '' }: NotesSectionProps) {
  const [selectedYear, setSelectedYear] = useState<YearLevel>(initialYear);
  const [selectedSemester, setSelectedSemester] = useState<SemesterLevel>('all');
  const [search, setSearch] = useState(initialSearch);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [completedSubjects, setCompletedSubjects] = useState<Record<string, boolean>>({});

  // Sync initialYear if changed from parent
  useEffect(() => {
    if (initialYear) {
      setSelectedYear(initialYear);
    }
  }, [initialYear]);

  // Load completed/revised subjects from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cc_notes_revised');
      if (saved) {
        setCompletedSubjects(JSON.parse(saved));
      }
    } catch {
      setCompletedSubjects({});
    }
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCompleted = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = { ...completedSubjects, [id]: !completedSubjects[id] };
    setCompletedSubjects(newState);
    localStorage.setItem('cc_notes_revised', JSON.stringify(newState));
  };

  const filteredNotes = notesData.filter(note => {
    const matchesYear = note.year === selectedYear;
    const matchesSemester = selectedSemester === 'all' ? true : note.semester === selectedSemester;
    const matchesSearch = note.title.toLowerCase().includes(search.toLowerCase()) ||
                          note.code.toLowerCase().includes(search.toLowerCase()) ||
                          note.description.toLowerCase().includes(search.toLowerCase()) ||
                          note.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
                          note.topics.some(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.subtopics.some(st => st.toLowerCase().includes(search.toLowerCase())));

    return matchesYear && matchesSemester && matchesSearch;
  });

  const totalYearSubjects = notesData.filter(n => n.year === selectedYear).length;
  const completedYearSubjects = notesData.filter(n => n.year === selectedYear && completedSubjects[n.id]).length;
  const yearProgressPercent = totalYearSubjects > 0 ? Math.round((completedYearSubjects / totalYearSubjects) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 p-6 sm:p-8 backdrop-blur-sm">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-bold uppercase tracking-widest">
              <GraduationCap className="h-3 w-3" /> Academic & Engineering Hub
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              1st Year & 2nd Year <span className="text-emerald-400">Engineering Notes</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Curated handwritten notes, syllabus modules, formula cheat sheets, video masterclasses, and previous year exam questions (PYQs).
            </p>
          </div>

          {/* Revision Progress Widget */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shrink-0 sm:w-64">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <BookmarkCheck className="h-3.5 w-3.5 text-emerald-400" /> Revision Track
              </span>
              <span className="text-emerald-400 font-bold">{completedYearSubjects}/{totalYearSubjects} Done</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${yearProgressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono text-center">
              {selectedYear === '1st-year' ? '1st Year Foundation Progress' : '2nd Year CS/IT Progress'}
            </p>
          </div>
        </div>
      </div>

      {/* Year Selection Tabs (1st Year vs 2nd Year) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Big Year Toggle Pills */}
        <div className="flex p-1.5 bg-slate-950 border border-slate-800 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => {
              setSelectedYear('1st-year');
              setSelectedSemester('all');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              selectedYear === '1st-year'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            1st Year (Foundation & Core)
          </button>

          <button
            onClick={() => {
              setSelectedYear('2nd-year');
              setSelectedSemester('all');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              selectedYear === '2nd-year'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            2nd Year (Core CS / IT)
          </button>
        </div>

        {/* Semester Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedSemester('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
              selectedSemester === 'all'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
            }`}
          >
            All Semesters
          </button>

          {selectedYear === '1st-year' ? (
            <>
              <button
                onClick={() => setSelectedSemester('sem-1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                  selectedSemester === 'sem-1'
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                }`}
              >
                Semester 1
              </button>
              <button
                onClick={() => setSelectedSemester('sem-2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                  selectedSemester === 'sem-2'
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                }`}
              >
                Semester 2
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedSemester('sem-3')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                  selectedSemester === 'sem-3'
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                }`}
              >
                Semester 3
              </button>
              <button
                onClick={() => setSelectedSemester('sem-4')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                  selectedSemester === 'sem-4'
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                }`}
              >
                Semester 4
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder={`Search ${selectedYear === '1st-year' ? '1st' : '2nd'} year subjects, topics, codes (e.g. DSA, Maths, OS, C)...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
      </div>

      {/* Notes Subject Cards Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotes.map((note, index) => {
            const isExpanded = !!expandedSubjects[note.id];
            const isCompleted = !!completedSubjects[note.id];

            return (
              <AnimatedCard key={note.id} className="flex flex-col h-full" delay={index * 0.05}>
                <div className="group relative flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-emerald-500/30 transition-all p-6 space-y-5">
                  {/* Top Bar: Subject Code, Semester & Completed Check */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md border ${note.badgeColor}`}>
                        {note.code}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
                        {note.semester.toUpperCase().replace('-', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {note.credits} Credits
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleCompleted(note.id, e)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono transition-colors cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title={isCompleted ? 'Marked as revised' : 'Mark as revised'}
                    >
                      {isCompleted ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Circle className="h-3 w-3" />}
                      <span>{isCompleted ? 'Revised' : 'Mark Revised'}</span>
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors font-mono">
                      {note.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {note.description}
                    </p>
                  </div>

                  {/* Highlights Bullet points */}
                  <div className="space-y-1.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-emerald-400" /> Key Exam Essentials
                    </div>
                    <ul className="space-y-1">
                      {note.highlights.map((h, i) => (
                        <li key={i} className="text-[11px] text-slate-300 flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expandable Syllabus & Topics Drawer */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(note.id)}
                      className="w-full flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 text-xs font-mono text-slate-300 transition-colors cursor-pointer border border-slate-800/60"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-emerald-400" />
                        Syllabus Modules ({note.topics.length} Units)
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-2 pt-1"
                        >
                          {note.topics.map((mod, mi) => (
                            <div key={mi} className="p-2.5 rounded-lg bg-slate-900/30 border border-slate-800/40 space-y-1">
                              <div className="text-[11px] font-bold text-white font-mono">{mod.title}</div>
                              <div className="flex flex-wrap gap-1">
                                {mod.subtopics.map((st, sti) => (
                                  <span key={sti} className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/60">
                                    {st}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Resource Action Buttons */}
                  <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center gap-2">
                    {note.resources.handwrittenNotesUrl && (
                      <a
                        href={note.resources.handwrittenNotesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-medium transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Notes & Guide
                      </a>
                    )}

                    {note.resources.cheatSheetUrl && (
                      <a
                        href={note.resources.cheatSheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono font-medium transition-colors"
                      >
                        <Download className="h-3.5 w-3.5 text-blue-400" />
                        Cheat Sheet
                      </a>
                    )}

                    {note.resources.pyqUrl && (
                      <a
                        href={note.resources.pyqUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono font-medium transition-colors"
                      >
                        <Award className="h-3.5 w-3.5 text-amber-400" />
                        PYQs
                      </a>
                    )}

                    {note.resources.videoPlaylistUrl && (
                      <a
                        href={note.resources.videoPlaylistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono font-medium transition-colors"
                      >
                        <Video className="h-3.5 w-3.5 text-rose-400" />
                        Lectures
                      </a>
                    )}
                  </div>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-950/40 border border-slate-800 rounded-3xl space-y-4">
          <GraduationCap className="h-10 w-10 text-slate-700 mx-auto" />
          <p className="text-slate-400 font-mono text-sm">No notes match your current filter.</p>
          <button
            onClick={() => {
              setSelectedSemester('all');
              setSearch('');
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Clear Search & Filters
          </button>
        </div>
      )}
    </div>
  );
}
