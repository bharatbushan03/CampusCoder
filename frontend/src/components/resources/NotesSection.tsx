'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  BookOpen, 
  Search, 
  Download, 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
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


  return (

    <div className="space-y-6">
      {/* Year Selection Tabs (1st Year, 2nd Year, Senior) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        {/* Big Year Toggle Pills */}
        <div className="flex flex-wrap p-1 bg-[#0e1422] border border-white/[0.08] rounded-xl w-full sm:w-auto gap-1">
          <button
            onClick={() => {
              setSelectedYear('1st-year');
              setSelectedSemester('all');
            }}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
              selectedYear === '1st-year'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1st Year
          </button>

          <button
            onClick={() => {
              setSelectedYear('2nd-year');
              setSelectedSemester('all');
            }}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
              selectedYear === '2nd-year'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2nd Year
          </button>

          <button
            onClick={() => {
              setSelectedYear('3rd-year');
              setSelectedSemester('all');
            }}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
              selectedYear === '3rd-year'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
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
          placeholder="Search subjects, codes (e.g. COM101, BSC101)"
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
                      <div className="space-y-1.5 bg-[#080b11] p-3 rounded-lg border border-white/[0.07]">
                        <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                          Key Exam Essentials
                        </div>
                        <ul className="space-y-1">
                          {note.highlights.map((h, i) => (
                            <li key={i} className="text-[11px] text-slate-300 flex items-center gap-2">
                              <span className="h-1 w-1 rounded-full bg-cyan-400 shrink-0" />
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
                          className="w-full flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#080b11] hover:bg-white/[0.05] text-xs font-mono text-slate-300 transition-colors cursor-pointer border border-white/[0.07]"
                        >
                          <span>
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
                                <div key={mi} className="p-2.5 rounded-lg bg-[#080b11] border border-white/[0.05] space-y-1">
                                  <div className="text-[11px] font-bold text-white font-mono">{mod.title}</div>
                                  {mod.subtopics && Array.isArray(mod.subtopics) && mod.subtopics.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {mod.subtopics.map((st, sti) => (
                                        <span key={sti} className="text-[10px] text-slate-400 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/[0.05]">
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
                  <div className="pt-3 border-t border-white/[0.07] grid grid-cols-2 gap-2">
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
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-sm transition-all cursor-pointer"
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
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#080b11] hover:bg-white/[0.05] text-slate-200 border border-white/[0.08] font-mono text-xs font-semibold transition-all cursor-pointer"
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
        <div className="text-center py-16 bg-[#0e1422] border border-white/[0.08] rounded-2xl space-y-3">
          <BookOpen className="h-8 w-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-mono text-xs">No notes match your current filter.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => {
                setSelectedSemester('all');
                setSearch('');
              }}
              className="px-3 py-1.5 rounded-lg bg-[#080b11] border border-white/[0.08] text-xs font-mono text-cyan-400 hover:text-white transition-colors cursor-pointer"
            >
              Clear Search & Filters
            </button>
            {isAdminOrOrganizer && (
              <Link href="/admin/notes/new">
                <Button size="sm" className="bg-emerald-500 text-slate-950 font-bold font-mono text-xs">
                  Upload Handbook (PDF)
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
