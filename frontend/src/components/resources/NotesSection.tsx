'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Search, 
  FileText,
  Loader2 
} from 'lucide-react';


import { YearLevel } from '@/data/notesData';
import { AnimatedCard } from '@/components/animations/ScrollAnimations';
import { Button } from '@/components/ui/Button';

import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

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
  initialYear?: YearLevel | 'all';
  initialSearch?: string;
  showAdminActions?: boolean;
}

export function NotesSection({ initialYear = 'all', initialSearch = '', showAdminActions = true }: NotesSectionProps) {
  const { user, profile } = useAuth();
  const isAdminOrOrganizer = user && profile && (profile.role === 'admin' || profile.role === 'organizer');

  const [selectedYear, setSelectedYear] = useState<string>(initialYear);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [search, setSearch] = useState(initialSearch);
  const [dynamicNotes, setDynamicNotes] = useState<DisplayNote[]>([]);
  const [loading, setLoading] = useState(true);

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
          setDynamicNotes([]);
        }
      } catch (err) {
        console.error('Error fetching notes:', err);
        setDynamicNotes([]);
      } finally {
        setLoading(false);
      }
    }

    void loadNotes();
  }, []);

  const yearCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: dynamicNotes.length,
      '1st-year': 0,
      '2nd-year': 0,
      '3rd-year': 0,
      '4th-year': 0,
    };
    dynamicNotes.forEach(n => {
      if (counts[n.year] !== undefined) {
        counts[n.year]++;
      }
    });
    return counts;
  }, [dynamicNotes]);

  const filteredNotes = useMemo(() => {
    return dynamicNotes.filter(note => {
      const matchesYear = selectedYear === 'all' ? true : note.year === selectedYear;
      const matchesSemester = selectedSemester === 'all' ? true : note.semester === selectedSemester;
      const matchesSearch = !search.trim() ||
                            note.title.toLowerCase().includes(search.toLowerCase()) ||
                            note.code.toLowerCase().includes(search.toLowerCase()) ||
                            note.description.toLowerCase().includes(search.toLowerCase()) ||
                            (note.tags && note.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) ||
                            (note.topics && note.topics.some(t => t.title.toLowerCase().includes(search.toLowerCase()) || (t.subtopics && t.subtopics.some(st => st.toLowerCase().includes(search.toLowerCase())))));

      return matchesYear && matchesSemester && matchesSearch;
    });
  }, [dynamicNotes, selectedYear, selectedSemester, search]);

  const subjectNotes = useMemo(() => {
    const grouped = new Map<string, DisplayNote>();
    filteredNotes.forEach(note => {
      if (!grouped.has(note.code)) {
        grouped.set(note.code, note);
      }
    });
    return Array.from(grouped.values());
  }, [filteredNotes]);

  return (
    <div className="space-y-6">
      {/* Year Selection Tabs (All, 1st Year, 2nd Year, 3rd Year, 4th Year) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        {/* Big Year Toggle Pills */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap p-1 bg-[#0e1422] border border-white/[0.08] rounded-xl w-full sm:w-auto gap-1">
          <button
            type="button"
            onClick={() => {
              setSelectedYear('all');
              setSelectedSemester('all');
            }}
            className={`px-3.5 py-2.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
              selectedYear === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Years {yearCounts.all > 0 && <span className="opacity-80 ml-1">({yearCounts.all})</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedYear('1st-year');
              setSelectedSemester('all');
            }}
            className={`px-3.5 py-2.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
              selectedYear === '1st-year'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1st Year {yearCounts['1st-year'] > 0 && <span className="opacity-80 ml-1">({yearCounts['1st-year']})</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedYear('2nd-year');
              setSelectedSemester('all');
            }}
            className={`px-3.5 py-2.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
              selectedYear === '2nd-year'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2nd Year {yearCounts['2nd-year'] > 0 && <span className="opacity-80 ml-1">({yearCounts['2nd-year']})</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedYear('3rd-year');
              setSelectedSemester('all');
            }}
            className={`px-3.5 py-2.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
              selectedYear === '3rd-year'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3rd Year {yearCounts['3rd-year'] > 0 && <span className="opacity-80 ml-1">({yearCounts['3rd-year']})</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedYear('4th-year');
              setSelectedSemester('all');
            }}
            className={`px-3.5 py-2.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
              selectedYear === '4th-year'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            4th Year {yearCounts['4th-year'] > 0 && <span className="opacity-80 ml-1">({yearCounts['4th-year']})</span>}
          </button>
        </div>

        {/* Semester Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
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
              {['sem-1', 'sem-2'].map(sem => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                    selectedSemester === sem
                      ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                  }`}
                >
                  Sem {sem.replace('sem-', '')}
                </button>
              ))}
            </>
          ) : selectedYear === '2nd-year' ? (
            <>
              {['sem-3', 'sem-4'].map(sem => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                    selectedSemester === sem
                      ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                  }`}
                >
                  Sem {sem.replace('sem-', '')}
                </button>
              ))}
            </>
          ) : selectedYear === '3rd-year' ? (
            <>
              {['sem-5', 'sem-6'].map(sem => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                    selectedSemester === sem
                      ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                  }`}
                >
                  Sem {sem.replace('sem-', '')}
                </button>
              ))}
            </>
          ) : selectedYear === '4th-year' ? (
            <>
              {['sem-7', 'sem-8'].map(sem => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                    selectedSemester === sem
                      ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                  }`}
                >
                  Sem {sem.replace('sem-', '')}
                </button>
              ))}
            </>
          ) : (
            <>
              {['sem-1', 'sem-2', 'sem-3', 'sem-4', 'sem-5', 'sem-6', 'sem-7', 'sem-8'].map(sem => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                    selectedSemester === sem
                      ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
                  }`}
                >
                  S{sem.replace('sem-', '')}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Search Input & Admin Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search subjects, codes (e.g. CS201, MATH101, DBMS)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {showAdminActions && isAdminOrOrganizer && (
          <Link href="/admin/notes/new" className="shrink-0">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs w-full sm:w-auto">
              + Upload Note PDF
            </Button>
          </Link>
        )}
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="size-8 text-blue-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading verified subject notes and PDF handbooks...</p>
        </div>
      ) : subjectNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectNotes.map((note, index) => {
            return (
              <AnimatedCard key={note.id} delay={index * 0.04} className="h-full">
                <Link
                  href={`/notes/${note.code}`}
                  className="group flex aspect-square h-auto min-h-0 flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-lg transition-all hover:border-cyan-500/50 hover:bg-slate-900/80"
                >
                  <div className="flex items-start justify-between gap-4">
                    <FileText className="size-6 text-cyan-300" strokeWidth={1.5} />
                    <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-mono font-bold text-cyan-300">
                      {note.code}
                    </span>
                  </div>
                  <div className="mt-6 space-y-2">
                    <h3 className="text-sm font-bold leading-snug text-white group-hover:text-cyan-300 transition-colors">
                      {note.title}
                    </h3>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                      {note.semester.replace('-', ' ')}
                    </p>
                  </div>
                </Link>
              </AnimatedCard>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#0e1422] border border-white/[0.08] rounded-2xl space-y-4 px-4">
          <BookOpen className="h-10 w-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white font-mono">
              {search || selectedSemester !== 'all' ? 'No Notes Found' : 'No Subject Notes Uploaded Yet'}
            </h3>
              <p className="text-slate-400 font-mono text-xs max-w-md mx-auto">
                {search || selectedSemester !== 'all'
                ? 'No subject notes match your current search or semester filter.'
                : 'Verified subject handbooks and academic notes will be added soon!'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {(search || selectedSemester !== 'all') && (
              <button
                onClick={() => {
                  setSelectedSemester('all');
                  setSearch('');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#080b11] border border-white/[0.08] text-xs font-mono text-cyan-400 hover:text-white transition-colors cursor-pointer"
              >
                Clear Search & Filters
              </button>
            )}
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


    </div>
  );
}
