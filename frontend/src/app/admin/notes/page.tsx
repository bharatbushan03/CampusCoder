'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Download, 
  RefreshCw, 
  Database,
  BookOpen
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { deleteNote, toggleNote } from '@/app/actions/adminActions';
import { toast } from 'sonner';
import { PdfViewerModal, PdfViewerData } from '@/components/resources/PdfViewerModal';

export type AdminNoteRow = {
  id: string;
  title: string;
  code: string;
  subject: string | null;
  year: string;
  semester: string;
  branch: string | null;
  description: string | null;
  pdf_url: string;
  file_size: string | null;
  page_count: number | null;
  author: string | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
};

export default function AdminNotesPage() {
  const [notes, setNotes] = useState<AdminNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [isSeeding, setIsSeeding] = useState(false);
  const [activePdfNote, setActivePdfNote] = useState<PdfViewerData | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ ok: boolean; notes: AdminNoteRow[] }>('/admin/notes');
      if (data && data.ok) {
        setNotes(data.notes || []);
      }
    } catch (err: any) {
      toast.error('Failed to load notes: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setNotes(prev => prev.map(n => n.id === id ? { ...n, is_active: !currentStatus } : n));
    try {
      await toggleNote(id);
      toast.success(currentStatus ? 'Note hidden' : 'Note made visible');
    } catch (err: any) {
      toast.error('Failed to toggle: ' + (err.message || 'Error'));
      void fetchNotes();
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    // Optimistic UI update
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      await deleteNote(id);
      toast.success(`Deleted "${title}"`);
    } catch (err: any) {
      toast.error('Failed to delete: ' + (err.message || 'Error'));
      void fetchNotes();
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await api<{ ok: boolean; message: string }>('/admin/notes/seed', {
        method: 'POST',
      });
      if (res && res.ok) {
        toast.success(res.message || 'Seeded notes successfully!');
        void fetchNotes();
      }
    } catch (err: any) {
      toast.error('Failed to seed: ' + (err.message || 'Error'));
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(search.toLowerCase()) ||
                            note.code.toLowerCase().includes(search.toLowerCase()) ||
                            (note.subject && note.subject.toLowerCase().includes(search.toLowerCase())) ||
                            (note.description && note.description.toLowerCase().includes(search.toLowerCase())) ||
                            note.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

      const matchesYear = yearFilter === 'all' || note.year === yearFilter;
      const matchesSemester = semesterFilter === 'all' || note.semester === semesterFilter;

      return matchesSearch && matchesYear && matchesSemester;
    });
  }, [notes, search, yearFilter, semesterFilter]);

  const counts = useMemo(() => {
    let firstYear = 0;
    let secondYear = 0;
    let otherYears = 0;
    notes.forEach(n => {
      if (n.year === '1st-year') firstYear++;
      else if (n.year === '2nd-year') secondYear++;
      else otherYears++;
    });
    return { total: notes.length, firstYear, secondYear, otherYears };
  }, [notes]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-400" /> Academic Notes & PDF Handbooks
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload PDF notes, organize by semester & branch, and manage online view / download access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotes}
            className="flex items-center gap-1.5 font-mono text-xs border-slate-700"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Link href="/admin/notes/new">
            <Button size="sm" className="flex items-center gap-1.5 font-mono text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">
              <Plus className="size-4" /> Upload Note (PDF)
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Total Handbooks</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{counts.total}</div>
        </Card>

        <Card className="bg-slate-900/60 border-blue-500/20 p-4">
          <div className="text-[10px] font-mono text-blue-400 uppercase">1st Year (Sem 1-2)</div>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-1">{counts.firstYear}</div>
        </Card>

        <Card className="bg-slate-900/60 border-indigo-500/20 p-4">
          <div className="text-[10px] font-mono text-indigo-400 uppercase">2nd Year (Sem 3-4)</div>
          <div className="text-2xl font-bold text-indigo-400 font-mono mt-1">{counts.secondYear}</div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Senior Semesters</div>
          <div className="text-2xl font-bold text-slate-300 font-mono mt-1">{counts.otherYears}</div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search notes by subject name, code (e.g. CS201, MATH101), description, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
        >
          <option value="all">Year: All Years</option>
          <option value="1st-year">1st Year</option>
          <option value="2nd-year">2nd Year</option>
          <option value="3rd-year">3rd Year</option>
          <option value="4th-year">4th Year</option>
        </select>

        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
        >
          <option value="all">Semester: All Semesters</option>
          <option value="sem-1">Semester 1</option>
          <option value="sem-2">Semester 2</option>
          <option value="sem-3">Semester 3</option>
          <option value="sem-4">Semester 4</option>
          <option value="sem-5">Semester 5</option>
          <option value="sem-6">Semester 6</option>
          <option value="sem-7">Semester 7</option>
          <option value="sem-8">Semester 8</option>
        </select>
      </div>

      {/* Notes Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl bg-slate-900/60" />
          ))}
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            return (
              <Card 
                key={note.id}
                className={`p-4 bg-slate-950/60 border transition-all ${
                  !note.is_active
                    ? 'border-slate-900 opacity-60'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/30">
                        {note.code}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                        {note.year.replace('-', ' ')}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-900 text-slate-400">
                        {note.semester.toUpperCase()}
                      </span>
                      {note.file_size && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          PDF • {note.file_size}
                        </span>
                      )}
                      {!note.is_active && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] text-amber-400 bg-amber-500/10 border border-amber-400/30 font-mono">
                          Hidden
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white font-mono truncate">
                      {note.title}
                    </h3>

                    {note.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {note.description}
                      </p>
                    )}

                    {note.branch && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        Branch: {note.branch}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-900">
                    {/* View Online (Opens in-app PDF modal) */}
                    <button
                      type="button"
                      onClick={() => setActivePdfNote({
                        title: note.title,
                        code: note.code,
                        pdfUrl: note.pdf_url,
                        fileSize: note.file_size || undefined,
                        semester: note.semester,
                        year: note.year
                      })}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 text-xs font-mono font-semibold transition-colors cursor-pointer"
                      title="Preview PDF online"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Online View</span>
                    </button>

                    {/* Direct Download */}
                    <a
                      href={note.pdf_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-mono transition-colors"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Download</span>
                    </a>

                    {/* Toggle Active */}
                    <button
                      type="button"
                      onClick={() => handleToggle(note.id, note.is_active)}
                      className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                        note.is_active
                          ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}
                      title={note.is_active ? 'Hide note' : 'Make visible'}
                    >
                      {note.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>

                    {/* Edit */}
                    <Link href={`/admin/notes/${note.id}/edit`}>
                      <button
                        type="button"
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors cursor-pointer"
                        title="Edit note"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </Link>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(note.id, note.title)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-950/40 border border-slate-800 rounded-3xl space-y-4">
          <GraduationCap className="h-10 w-10 text-slate-700 mx-auto" />
          <p className="text-slate-400 font-mono text-sm">No notes found in the library.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/admin/notes/new">
              <Button size="sm" className="bg-emerald-500 text-slate-950 font-bold font-mono text-xs">
                <Plus className="size-3.5" /> Upload First Note (PDF)
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={isSeeding}
              className="border-slate-700 text-xs font-mono text-slate-300"
            >
              <Database className="size-3.5 text-amber-400" />
              {isSeeding ? 'Seeding...' : 'Seed Sample Subject Handbooks'}
            </Button>
          </div>
        </div>
      )}

      {/* Interactive PDF Reader Modal */}
      <PdfViewerModal
        note={activePdfNote}
        isOpen={!!activePdfNote}
        onClose={() => setActivePdfNote(null)}
      />
    </div>
  );
}
