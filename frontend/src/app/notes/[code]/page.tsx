'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Search, Loader2, BookOpen, Circle, CheckCircle2, ChevronDown, ChevronUp, Download, Eye, ArrowLeft, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AnimatedSection, AnimatedCard } from '@/components/animations/ScrollAnimations';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { PdfViewerModal, PdfViewerData } from '@/components/resources/PdfViewerModal';

interface SubjectNote {
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

export default function SubjectNotesPage() {
  const { user, profile } = useAuth();
  const isAdminOrOrganizer = user && profile && (profile.role === 'admin' || profile.role === 'organizer');
  const { code } = useParams<{ code: string }>();

  const [search, setSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [completedSubjects, setCompletedSubjects] = useState<Record<string, boolean>>({});
  const [dynamicNotes, setDynamicNotes] = useState<SubjectNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePdfNote, setActivePdfNote] = useState<PdfViewerData | null>(null);

  // Fetch notes filtered by subject code
  useEffect(() => {
    async function loadNotes() {
      if (!code) {
        setDynamicNotes([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch all notes and filter client-side by code
        const res = await api<{ ok: boolean; notes: any[] }>('/notes?semester=all');
        if (res && res.ok && Array.isArray(res.notes) && res.notes.length > 0) {
          const allNotes: SubjectNote[] = res.notes.map((n: any) => ({
            id: n.id,
            title: n.title,
            code: n.code || '',
            subject: n.subject || n.title,
            year: n.year || 'all',
            semester: n.semester || 'all',
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

          // Filter by subject code
          const filteredNotes = allNotes.filter(note => note.code === code);
          setDynamicNotes(filteredNotes.length > 0 ? filteredNotes : []);
        } else {
          setDynamicNotes([]);
        }
      } catch (err) {
        console.error('Error fetching subject notes:', err);
        setDynamicNotes([]);
      } finally {
        setLoading(false);
      }
    }

    void loadNotes();
  }, [code]);

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
      const matchesSemester = selectedSemester === 'all' ? true : note.semester === selectedSemester;
      const matchesSearch = !search.trim() ||
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.code.toLowerCase().includes(search.toLowerCase()) ||
        note.description.toLowerCase().includes(search.toLowerCase()) ||
        (note.tags && note.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) ||
        (note.topics && note.topics.some(t => t.title.toLowerCase().includes(search.toLowerCase()) || (t.subtopics && t.subtopics.some(st => st.toLowerCase().includes(search.toLowerCase())))));

      return matchesSemester && matchesSearch;
    });
  }, [dynamicNotes, selectedSemester, search]);

  const subjectOverview = dynamicNotes[0];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Page Header */}
      <AnimatedSection className="space-y-3" direction="up">
        <Link href="/resources?category=notes" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors">
          <ArrowLeft className="size-3.5" /> Back to subject library
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-white/[0.08] pb-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-md px-2 py-1">
                Subject materials
              </span>
              {subjectOverview?.year && <span className="text-[10px] font-mono text-slate-500">{subjectOverview.year.replace('-', ' ')}</span>}
              {subjectOverview?.branch && <span className="text-[10px] font-mono text-slate-500">{subjectOverview.branch}</span>}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {code || 'Subject Notes'}
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              {subjectOverview?.subject || subjectOverview?.title || 'Browse the available handbooks and study documents for this subject.'}
            </p>
          </div>

          {isAdminOrOrganizer && code && (
            <div className="flex items-center gap-2">
              <Link href="/admin/notes/new" className="shrink-0">
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs w-auto">
                  + Upload Note PDF
                </Button>
              </Link>
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* Search & Semester Filter */}
      <AnimatedSection direction="none" delay={0.05}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0b101b]/80 p-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search titles, descriptions, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedSemester !== 'all' && (
              <span className="px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800 text-xs font-mono text-slate-400">
                Sem {selectedSemester.replace('sem-', '')}
              </span>
            )}
          </div>

          {selectedSemester !== 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSemester('all');
              }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Clear Filter
            </Button>
          )}
        </div>
      </AnimatedSection>

      {/* Notes Grid */}
      {loading ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0b101b]/80 py-20 flex flex-col items-center justify-center space-y-3">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
            <Loader2 className="size-6 text-cyan-300 animate-spin" />
          </div>
          <p className="text-xs font-mono text-slate-400">Loading subject documents...</p>
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredNotes.map((note, index) => {
            const isExpanded = !!expandedSubjects[note.id];
            const isCompleted = !!completedSubjects[note.id];

            return (
              <AnimatedCard key={note.id} delay={index * 0.04}>
                <div className="h-full rounded-2xl border border-slate-800 bg-slate-950/70 p-5 hover:border-cyan-500/40 transition-all shadow-lg flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-5 text-cyan-300">
                      <FileText className="size-12" strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">PDF {String(index + 1).padStart(2, '0')}</span>
                  </div>

                  <div className="mt-5 flex-1 space-y-2">
                    <h3 className="text-base font-bold text-white leading-snug">{note.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{note.description}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[10px] font-mono text-slate-500">
                      <span>Sem {note.semester.replace('sem-', '')}</span>
                      {note.fileSize && <span>{note.fileSize}</span>}
                      {note.pageCount && <span>{note.pageCount} pages</span>}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      onClick={(e) => toggleCompleted(note.id, e)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-colors cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title={isCompleted ? 'Marked as revised' : 'Mark as revised'}
                    >
                      {isCompleted ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
                      <span>{isCompleted ? 'Revised' : 'Mark revised'}</span>
                    </button>
                  </div>

                  <div className="pt-3 border-t border-white/[0.07] grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(note.id)}
                      className="col-span-2 inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      {isExpanded ? 'Hide document details' : 'Show document details'}
                    </button>

                    <div className="contents">
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
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-sm transition-all cursor-pointer"
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
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900/80 hover:bg-slate-900/90 text-slate-200 border border-white/[0.08] font-mono text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Download PDF</span>
                    </a>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 border-t border-white/[0.07] pt-4 space-y-4"
                      >
                        {note.description && <p className="text-xs text-slate-400 leading-relaxed">{note.description}</p>}
                        {note.highlights.length > 0 && (
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">Key exam essentials</p>
                            <ul className="grid sm:grid-cols-2 gap-1.5">
                              {note.highlights.map((highlight, highlightIndex) => (
                                <li key={highlightIndex} className="text-[11px] text-slate-300 flex gap-2">
                                  <span className="mt-1.5 size-1 rounded-full bg-cyan-400 shrink-0" />
                                  {highlight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {note.topics.length > 0 && (
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">Syllabus modules</p>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {note.topics.map((topic, topicIndex) => (
                                <div key={topicIndex} className="rounded-lg bg-[#080b11] border border-white/[0.06] p-2.5">
                                  <p className="text-[11px] font-bold text-white">{topic.title}</p>
                                  {topic.subtopics.length > 0 && <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">{topic.subtopics.join(' • ')}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#0e1422] border border-white/[0.08] rounded-2xl space-y-4 px-4">
          <BookOpen className="h-10 w-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white font-mono">
              {search ? 'No notes found for this filter.' : 'No notes uploaded yet'}
            </h3>
            <p className="text-slate-400 font-mono text-xs max-w-md mx-auto">
              {search
                ? 'Try another topic, clear the filters, or search for a different chapter.'
                : 'Verified subject handbooks and academic notes will be added soon!'}
            </p>
          </div>
          {(search || selectedSemester !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedSemester('all');
              }}
              className="text-xs font-mono"
            >
              Clear Filters
            </Button>
          )}
          {isAdminOrOrganizer && code && (
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Link href="/admin/notes/new">
                <Button size="sm" className="bg-emerald-500 text-slate-950 font-bold font-mono text-xs">
                  Upload Handbook (PDF)
                </Button>
              </Link>
            </div>
          )}
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