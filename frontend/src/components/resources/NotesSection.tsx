'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  BookOpen, 
  Search, 
  GraduationCap, 
  Download, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  BookmarkCheck,
  PlusCircle,
  Settings,
  Eye,
  Loader2
} from 'lucide-react';
import { notesData as defaultNotesData, YearLevel } from '@/data/notesData';
import { AnimatedCard } from '@/components/animations/ScrollAnimations';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { PdfViewerModal, PdfViewerData } from '@/components/resources/PdfViewerModal';

export interface DisplayNote {
  id: string;
  title: string;
  code: string;
  subject?: string;
  year: string;
  semester: string;
  branch?: string;
  description: string;
  pdfUrl: string;
  fileSize?: string;
  pageCount?: number;
  author?: string;
  tags: string[];
  topics: Array<{ title: string; subtopics: string[] }>;
  highlights: string[];
}

interface NotesSectionProps {
  initialYear?: YearLevel;
  initialSearch?: string;
}

export function NotesSection({ initialYear = '1st-year', initialSearch = '' }: NotesSectionProps) {
  const { user, profile } = useAuth();
  const isAdminOrOrganizer = user && profile && (profile.role === 'admin' || profile.role === 'organizer');

  const [selectedYear, setSelectedYear] = useState<string>(initialYear);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [search, setSearch] = useState(initialSearch);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [completedSubjects, setCompletedSubjects] = useState<Record<string, boolean>>({});
  const [dynamicNotes, setDynamicNotes] = useState<DisplayNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePdfNote, setActivePdfNote] = useState<PdfViewerData | null>(null);

  // Sync initialYear if changed from parent
  useEffect(() => {
    if (initialYear) {
      setSelectedYear(initialYear);
    }
  }, [initialYear]);

  // Load dynamic notes from backend API
  useEffect(() => {
    async function loadNotes() {
      setLoading(true);
      try {
        const res = await api<{ ok: boolean; notes: any[] }>('/notes');
        if (res && res.ok && Array.isArray(res.notes) && res.notes.length > 0) {
          const mapped: DisplayNote[] = res.notes.map(n => ({
            id: n.id,
            title: n.title,
            code: n.code,
            subject: n.subject || n.title,
            year: n.year || '1st-year',
            semester: n.semester || 'sem-1',
            branch: n.branch || 'All Branches',
            description: n.description || '',
            pdfUrl: n.pdf_url,
            fileSize: n.file_size || 'PDF Document',
            pageCount: n.page_count || undefined,
            author: n.author || undefined,
            tags: Array.isArray(n.tags) ? n.tags : [],
            topics: Array.isArray(n.topics) ? n.topics : [],
            highlights: Array.isArray(n.highlights) ? n.highlights : []
          }));
          setDynamicNotes(mapped);
        } else {
          // Map default fallback notes
          const mappedDefaults: DisplayNote[] = defaultNotesData.map(n => ({
            id: n.id,
            title: n.title,
            code: n.code,
            subject: n.title,
            year: n.year,
            semester: n.semester,
            branch: 'Engineering',
            description: n.description,
            pdfUrl: n.resources.cheatSheetUrl || n.resources.handwrittenNotesUrl || 'https://tutorial.math.lamar.edu/pdf/Calculus_Cheat_Sheet_All.pdf',
            fileSize: '4.8 MB',
            tags: n.tags,
            topics: n.topics,
            highlights: n.highlights
          }));
          setDynamicNotes(mappedDefaults);
        }
      } catch (err) {
        console.error('Error fetching notes:', err);
        const mappedDefaults: DisplayNote[] = defaultNotesData.map(n => ({
          id: n.id,
          title: n.title,
          code: n.code,
          subject: n.title,
          year: n.year,
          semester: n.semester,
          branch: 'Engineering',
          description: n.description,
          pdfUrl: n.resources.cheatSheetUrl || n.resources.handwrittenNotesUrl || 'https://tutorial.math.lamar.edu/pdf/Calculus_Cheat_Sheet_All.pdf',
          fileSize: '4.8 MB',
          tags: n.tags,
          topics: n.topics,
          highlights: n.highlights
        }));
        setDynamicNotes(mappedDefaults);
      } finally {
        setLoading(false);
      }
    }

    void loadNotes();
  }, []);

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

  const filteredNotes = useMemo(() => {
    return dynamicNotes.filter(note => {
      const matchesYear = note.year === selectedYear;
      const matchesSemester = selectedSemester === 'all' ? true : note.semester === selectedSemester;
      const matchesSearch = note.title.toLowerCase().includes(search.toLowerCase()) ||
                            note.code.toLowerCase().includes(search.toLowerCase()) ||
                            note.description.toLowerCase().includes(search.toLowerCase()) ||
                            (note.tags && note.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) ||
                            (note.topics && note.topics.some(t => t.title.toLowerCase().includes(search.toLowerCase()) || (t.subtopics && t.subtopics.some(st => st.toLowerCase().includes(search.toLowerCase())))));

      return matchesYear && matchesSemester && matchesSearch;
    });
  }, [dynamicNotes, selectedYear, selectedSemester, search]);

  const totalYearSubjects = useMemo(() => {
    return dynamicNotes.filter(n => n.year === selectedYear).length;
  }, [dynamicNotes, selectedYear]);

  const completedYearSubjects = useMemo(() => {
    return dynamicNotes.filter(n => n.year === selectedYear && completedSubjects[n.id]).length;
  }, [dynamicNotes, selectedYear, completedSubjects]);

  const yearProgressPercent = totalYearSubjects > 0 ? Math.round((completedYearSubjects / totalYearSubjects) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 p-6 sm:p-8 backdrop-blur-sm">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-bold uppercase tracking-widest">
                <GraduationCap className="h-3 w-3" /> Academic & Engineering Hub
              </div>

              {/* Admin Shortcut Badges */}
              {isAdminOrOrganizer && (
                <div className="flex items-center gap-2">
                  <Link href="/admin/notes">
                    <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] font-mono border-blue-500/30 text-blue-300 hover:bg-blue-500/10">
                      <Settings className="size-3 mr-1" /> Manage Notes
                    </Button>
                  </Link>
                  <Link href="/admin/notes/new">
                    <Button size="sm" className="h-7 px-2.5 text-[11px] font-mono bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400">
                      <PlusCircle className="size-3 mr-1" /> Upload Notes
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              Engineering <span className="text-blue-400">Handbooks & Notes</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Access verified PDF syllabus notes with double convenience: read directly in our <strong className="text-slate-200">Online Viewer</strong> or <strong className="text-slate-200">Download for Offline Study</strong>.
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
              {selectedYear === '1st-year' ? '1st Year Foundation Progress' : 'Core Engineering Progress'}
            </p>
          </div>
        </div>
      </div>

      {/* Year Selection Tabs (1st Year, 2nd Year, Senior) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Big Year Toggle Pills */}
        <div className="flex flex-wrap p-1.5 bg-slate-950 border border-slate-800 rounded-2xl w-full sm:w-auto gap-1">
          <button
            onClick={() => {
              setSelectedYear('1st-year');
              setSelectedSemester('all');
            }}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              selectedYear === '1st-year'
                ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            1st Year
          </button>

          <button
            onClick={() => {
              setSelectedYear('2nd-year');
              setSelectedSemester('all');
            }}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              selectedYear === '2nd-year'
                ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            2nd Year
          </button>

          <button
            onClick={() => {
              setSelectedYear('3rd-year');
              setSelectedSemester('all');
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              selectedYear === '3rd-year'
                ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3rd Year
          </button>

          <button
            onClick={() => {
              setSelectedYear('4th-year');
              setSelectedSemester('all');
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              selectedYear === '4th-year'
                ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            4th Year
          </button>
        </div>

        {/* Semester Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedSemester('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
              selectedSemester === 'all'
                ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
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
                    ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                }`}
              >
                Sem 1
              </button>
              <button
                onClick={() => setSelectedSemester('sem-2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                  selectedSemester === 'sem-2'
                    ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                }`}
              >
                Sem 2
              </button>
            </>
          ) : selectedYear === '2nd-year' ? (
            <>
              <button
                onClick={() => setSelectedSemester('sem-3')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                  selectedSemester === 'sem-3'
                    ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                }`}
              >
                Sem 3
              </button>
              <button
                onClick={() => setSelectedSemester('sem-4')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                  selectedSemester === 'sem-4'
                    ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                }`}
              >
                Sem 4
              </button>
            </>
          ) : selectedYear === '3rd-year' ? (
            <>
              <button
                onClick={() => setSelectedSemester('sem-5')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                  selectedSemester === 'sem-5' ? 'bg-slate-800 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                }`}
              >
                Sem 5
              </button>
              <button
                onClick={() => setSelectedSemester('sem-6')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                  selectedSemester === 'sem-6' ? 'bg-slate-800 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                }`}
              >
                Sem 6
              </button>
            </>
          ) : selectedYear === '4th-year' ? (
            <>
              <button
                onClick={() => setSelectedSemester('sem-7')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                  selectedSemester === 'sem-7' ? 'bg-slate-800 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                }`}
              >
                Sem 7
              </button>
              <button
                onClick={() => setSelectedSemester('sem-8')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                  selectedSemester === 'sem-8' ? 'bg-slate-800 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                }`}
              >
                Sem 8
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search subjects, codes (e.g. CS201, MATH101), topics, or concepts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="size-8 text-blue-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading verified subject notes and PDF handbooks...</p>
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredNotes.map((note, index) => {
            const isExpanded = !!expandedSubjects[note.id];
            const isCompleted = !!completedSubjects[note.id];

            return (
              <AnimatedCard key={note.id} delay={index * 0.04}>
                <div className="h-full rounded-3xl border border-slate-800 bg-slate-950/60 p-6 space-y-4 hover:border-blue-500/40 transition-all flex flex-col justify-between group shadow-xl">
                  <div className="space-y-4">
                    {/* Top Metadata & Revised Toggle */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/30">
                          {note.code}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                          {note.semester.toUpperCase().replace('-', ' ')}
                        </span>
                        {note.fileSize && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            PDF • {note.fileSize}
                          </span>
                        )}
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
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors font-mono">
                        {note.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {note.description}
                      </p>
                    </div>

                    {/* Highlights Bullet points */}
                    {note.highlights && note.highlights.length > 0 && (
                      <div className="space-y-1.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                        <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-blue-400" /> Key Exam Essentials
                        </div>
                        <ul className="space-y-1">
                          {note.highlights.map((h, i) => (
                            <li key={i} className="text-[11px] text-slate-300 flex items-center gap-2">
                              <span className="h-1 w-1 rounded-full bg-blue-400 shrink-0" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Expandable Syllabus & Topics Drawer */}
                    {note.topics && note.topics.length > 0 && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(note.id)}
                          className="w-full flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 text-xs font-mono text-slate-300 transition-colors cursor-pointer border border-slate-800/60"
                        >
                          <span className="flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-blue-400" />
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
                                  {mod.subtopics && Array.isArray(mod.subtopics) && mod.subtopics.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {mod.subtopics.map((st, sti) => (
                                        <span key={sti} className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/60">
                                          {st}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* TWO USER ACCESS WAYS: 1) Online View, 2) Download */}
                  <div className="pt-3 border-t border-slate-900 grid grid-cols-2 gap-2">
                    {/* Way 1: Online View Modal */}
                    <button
                      type="button"
                      onClick={() => setActivePdfNote({
                        title: note.title,
                        code: note.code,
                        pdfUrl: note.pdfUrl,
                        fileSize: note.fileSize,
                        semester: note.semester,
                        year: note.year
                      })}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-mono font-bold text-xs shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Online</span>
                    </button>

                    {/* Way 2: Direct Download */}
                    <a
                      href={note.pdfUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-mono text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Download PDF</span>
                    </a>
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
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setSelectedSemester('all');
                setSearch('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Clear Search & Filters
            </button>
            {isAdminOrOrganizer && (
              <Link href="/admin/notes/new">
                <Button size="sm" className="bg-emerald-500 text-slate-950 font-bold font-mono text-xs">
                  <PlusCircle className="size-3.5" /> Upload Handbook (PDF)
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Interactive PDF Reader Study Desk Modal */}
      <PdfViewerModal
        note={activePdfNote}
        isOpen={!!activePdfNote}
        onClose={() => setActivePdfNote(null)}
      />
    </div>
  );
}
