'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Eye, 
  Download, 
  RefreshCw, 
  Database,
  BookOpen,
  Folder,
  LayoutGrid,
  Table as TableIcon,
  X,
  Loader2,
  MoreVertical,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { 
  deleteNote, 
  toggleNote, 
  createNoteFolder, 
  updateNoteFolder, 
  deleteNoteFolder, 
  batchCreateNotes,
  updateSubjectNotes,
  deleteSubjectNotes
} from '@/app/actions/adminActions';
import { toast } from 'sonner';
import { PdfViewerModal, type PdfViewerData } from '@/components/resources/PdfViewerModal';
import { DriveExplorer, type NoteFolder, type SubjectMetadata } from '@/components/notes/DriveExplorer';

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
  folder_id?: string | null;
  folder_name?: string | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
};

export default function AdminNotesPage() {
  const [notes, setNotes] = useState<AdminNoteRow[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'drive' | 'table'>('drive');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string | null>(null);

  // Table filters
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [isSeeding, setIsSeeding] = useState(false);
  const [activePdfNote, setActivePdfNote] = useState<PdfViewerData | null>(null);

  // Add Subject Modal
  const [isNewSubjectModalOpen, setIsNewSubjectModalOpen] = useState(false);
  const [newSubjectData, setNewSubjectData] = useState({
    code: '',
    subject: '',
    year: '1st-year',
    semester: 'sem-1',
    branch: 'All Branches',
  });

  // Edit Subject Modal State
  const [activeSubjectMenu, setActiveSubjectMenu] = useState<string | null>(null);
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<SubjectMetadata | null>(null);
  const [editSubjectData, setEditSubjectData] = useState({
    newCode: '',
    subject: '',
    year: '1st-year',
    semester: 'sem-1',
    branch: 'All Branches',
  });
  const [isSavingSubject, setIsSavingSubject] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [notesRes, foldersRes] = await Promise.all([
        api<{ ok: boolean; notes: AdminNoteRow[] }>('/admin/notes'),
        api<{ ok: boolean; folders: NoteFolder[] }>('/admin/notes/folders'),
      ]);

      if (notesRes && notesRes.ok) {
        setNotes(notesRes.notes || []);
      }
      if (foldersRes && foldersRes.ok) {
        setFolders(foldersRes.folders || []);
      }
    } catch (err: any) {
      toast.error('Failed to load notes data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Derived subjects list
  const subjectsMap = useMemo(() => {
    const map = new Map<string, SubjectMetadata & { docCount: number; folderCount: number }>();

    // From notes
    notes.forEach((n) => {
      const code = n.code;
      if (!code) return;
      if (!map.has(code)) {
        map.set(code, {
          code,
          subject: n.subject || n.title,
          year: n.year,
          semester: n.semester,
          branch: n.branch || 'All Branches',
          docCount: 0,
          folderCount: 0,
        });
      }
      const entry = map.get(code)!;
      entry.docCount++;
    });

    // From folders
    folders.forEach((f) => {
      const code = f.subject_code;
      if (!code) return;
      if (!map.has(code)) {
        map.set(code, {
          code,
          subject: code,
          year: '1st-year',
          semester: 'sem-1',
          branch: 'All Branches',
          docCount: 0,
          folderCount: 0,
        });
      }
      const entry = map.get(code)!;
      entry.folderCount++;
    });

    return map;
  }, [notes, folders]);

  const subjectsList = useMemo(() => {
    return Array.from(subjectsMap.values());
  }, [subjectsMap]);

  const activeSubject: SubjectMetadata | null = useMemo(() => {
    if (!selectedSubjectCode) return null;
    return subjectsMap.get(selectedSubjectCode) || {
      code: selectedSubjectCode,
      subject: selectedSubjectCode,
      year: '1st-year',
      semester: 'sem-1',
      branch: 'All Branches',
    };
  }, [selectedSubjectCode, subjectsMap]);

  // Folders & documents for active subject
  const activeSubjectFolders = useMemo(() => {
    if (!selectedSubjectCode) return [];
    return folders.filter((f) => f.subject_code === selectedSubjectCode);
  }, [folders, selectedSubjectCode]);

  const activeSubjectDocs = useMemo(() => {
    if (!selectedSubjectCode) return [];
    return notes.filter((n) => n.code === selectedSubjectCode);
  }, [notes, selectedSubjectCode]);

  // Folder CRUD handlers for DriveExplorer
  const handleCreateFolder = async (name: string, parentId: string | null, color?: string) => {
    if (!selectedSubjectCode) return false;
    const res = await createNoteFolder({
      name,
      subject_code: selectedSubjectCode,
      parent_id: parentId,
      color: color || 'blue',
    });
    return res.success;
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    const res = await updateNoteFolder(folderId, { name: newName });
    return res.success;
  };

  const handleDeleteFolder = async (folderId: string) => {
    const res = await deleteNoteFolder(folderId);
    return res.success;
  };

  const handleDeleteDocument = async (docId: string) => {
    const res = await deleteNote(docId);
    return res.success;
  };

  const handleBatchUpload = async (
    files: Array<{ title: string; pdf_url: string; file_size: string }>,
    folderId: string | null,
    folderName: string | null
  ) => {
    if (!activeSubject) return false;
    const res = await batchCreateNotes({
      code: activeSubject.code,
      subject: activeSubject.subject,
      year: (activeSubject.year as any) || '1st-year',
      semester: activeSubject.semester || 'sem-1',
      branch: activeSubject.branch || 'All Branches',
      folder_id: folderId,
      folder_name: folderName,
      files,
    });
    return res.success;
  };

  // Create new subject
  const handleCreateNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectData.code.trim()) {
      toast.error('Subject code is required');
      return;
    }

    const code = newSubjectData.code.trim().toUpperCase();
    setSelectedSubjectCode(code);
    setIsNewSubjectModalOpen(false);
    toast.success(`Subject "${code}" initialized! You can now create folders or upload documents.`);
  };

  // Delete entire subject
  const handleDeleteSubjectClick = async (subj: SubjectMetadata & { docCount: number; folderCount: number }) => {
    if (!window.confirm(`Are you sure you want to delete subject "${subj.code} - ${subj.subject}" and ALL its ${subj.docCount} file(s) and ${subj.folderCount} folder(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await deleteSubjectNotes(subj.code);
      if (res.success) {
        toast.success(`Deleted subject "${subj.code}" and all associated files.`);
        if (selectedSubjectCode === subj.code) {
          setSelectedSubjectCode(null);
        }
        await fetchData();
      } else {
        toast.error('Failed to delete subject notes.');
      }
    } catch (err: any) {
      toast.error('Failed to delete subject: ' + (err.message || 'Error'));
    }
  };

  // Update subject details
  const handleEditSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectToEdit || !editSubjectData.newCode.trim()) {
      toast.error('Subject code is required');
      return;
    }

    setIsSavingSubject(true);
    try {
      const res = await updateSubjectNotes(subjectToEdit.code, {
        newCode: editSubjectData.newCode.trim().toUpperCase(),
        subject: editSubjectData.subject.trim(),
        year: editSubjectData.year,
        semester: editSubjectData.semester,
        branch: editSubjectData.branch,
      });

      if (res.success) {
        toast.success('Subject details updated successfully!');
        setIsEditSubjectModalOpen(false);
        setSubjectToEdit(null);
        if (selectedSubjectCode === subjectToEdit.code) {
          setSelectedSubjectCode(editSubjectData.newCode.trim().toUpperCase());
        }
        await fetchData();
      } else {
        toast.error('Failed to update subject.');
      }
    } catch (err: any) {
      toast.error('Failed to update subject: ' + (err.message || 'Error'));
    } finally {
      setIsSavingSubject(false);
    }
  };

  // Table actions
  const handleToggle = async (id: string, currentStatus: boolean) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, is_active: !currentStatus } : n)));
    try {
      await toggleNote(id);
      toast.success(currentStatus ? 'Note hidden' : 'Note made visible');
    } catch (err: any) {
      toast.error('Failed to toggle: ' + (err.message || 'Error'));
      void fetchData();
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNote(id);
      toast.success(`Deleted "${title}"`);
    } catch (err: any) {
      toast.error('Failed to delete: ' + (err.message || 'Error'));
      void fetchData();
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
        void fetchData();
      }
    } catch (err: any) {
      toast.error('Failed to seed: ' + (err.message || 'Error'));
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.code.toLowerCase().includes(search.toLowerCase()) ||
        (note.subject && note.subject.toLowerCase().includes(search.toLowerCase())) ||
        (note.folder_name && note.folder_name.toLowerCase().includes(search.toLowerCase())) ||
        (note.description && note.description.toLowerCase().includes(search.toLowerCase())) ||
        note.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchesYear = yearFilter === 'all' || note.year === yearFilter;
      const matchesSemester = semesterFilter === 'all' || note.semester === semesterFilter;

      return matchesSearch && matchesYear && matchesSemester;
    });
  }, [notes, search, yearFilter, semesterFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="size-7 text-cyan-400" />
            Academic Notes & PDF Library
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Google Drive-style folder organization, multi-document batch uploads (up to 50MB), and public handbook distribution.
          </p>
        </div>

        {/* View mode toggle: Google Drive Explorer vs All Files Table */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('drive')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeTab === 'drive'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="size-4" /> Google Drive View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="size-4" /> All Files Table
            </button>
          </div>

          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
            title="Refresh notes data"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TAB 1: GOOGLE DRIVE EXPLORER VIEW */}
      {activeTab === 'drive' && (
        <div className="space-y-6">
          {selectedSubjectCode && activeSubject ? (
            /* Inside a Selected Subject */
            <DriveExplorer
              subject={activeSubject}
              folders={activeSubjectFolders}
              documents={activeSubjectDocs}
              isAdmin={true}
              loading={loading}
              onRefresh={fetchData}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onDeleteDocument={handleDeleteDocument}
              onBatchUpload={handleBatchUpload}
              onBackToSubjects={() => setSelectedSubjectCode(null)}
            />
          ) : (
            /* Subjects Grid (Drive Root) */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Folder className="size-5 text-cyan-400" /> Choose a Subject to Open
                  </h2>
                  <p className="text-xs font-mono text-slate-400">
                    Each subject has its own Google Drive folder space where you can create units, folders, and upload PDFs.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsNewSubjectModalOpen(true)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs shadow-sm"
                  >
                    <Plus className="size-3.5 mr-1" /> + Add New Subject
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-2xl bg-slate-900/60" />
                  ))}
                </div>
              ) : subjectsList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {subjectsList.map((subj) => (
                    <div
                      key={subj.code}
                      onClick={() => setSelectedSubjectCode(subj.code)}
                      className="group flex flex-col justify-between p-5 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all cursor-pointer shadow-lg space-y-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 text-cyan-300 group-hover:scale-105 transition-transform">
                          <Folder className="size-7" />
                        </div>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                            {subj.code}
                          </span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveSubjectMenu(activeSubjectMenu === subj.code ? null : subj.code)}
                              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              title="Subject actions"
                            >
                              <MoreVertical className="size-4" />
                            </button>

                            {activeSubjectMenu === subj.code && (
                              <div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-xl space-y-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveSubjectMenu(null);
                                    setSubjectToEdit(subj);
                                    setEditSubjectData({
                                      newCode: subj.code,
                                      subject: subj.subject || subj.code,
                                      year: subj.year || '1st-year',
                                      semester: subj.semester || 'sem-1',
                                      branch: subj.branch || 'All Branches',
                                    });
                                    setIsEditSubjectModalOpen(true);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-900 hover:text-white transition-colors text-left"
                                >
                                  <Edit3 className="size-3.5 text-cyan-400" /> Edit Subject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveSubjectMenu(null);
                                    void handleDeleteSubjectClick(subj);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                                >
                                  <Trash2 className="size-3.5" /> Delete Subject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                          {subj.subject || subj.code}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500">
                          {subj.year ? subj.year.replace('-', ' ') : 'All Years'} • {subj.semester ? subj.semester.replace('-', ' ') : ''}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>{subj.folderCount} folder{subj.folderCount !== 1 ? 's' : ''}</span>
                        <span>{subj.docCount} file{subj.docCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 rounded-3xl border border-slate-800 bg-slate-950/50 space-y-4">
                  <BookOpen className="size-10 text-slate-600 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">No Subjects Added Yet</h3>
                    <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
                      Add a subject or seed demo course notes to start organizing folders like Google Drive.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <Button
                      size="sm"
                      onClick={() => setIsNewSubjectModalOpen(true)}
                      className="bg-cyan-500 text-slate-950 font-bold font-mono text-xs"
                    >
                      <Plus className="size-3.5 mr-1" /> Add First Subject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSeed}
                      disabled={isSeeding}
                      className="text-xs font-mono border-slate-700"
                    >
                      <Database className="size-3.5 text-amber-400 mr-1.5" />
                      {isSeeding ? 'Seeding...' : 'Seed Sample Subjects'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL FILES AUDIT TABLE */}
      {activeTab === 'table' && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by title, subject, folder, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
              >
                <option value="all">All Years</option>
                <option value="1st-year">1st Year</option>
                <option value="2nd-year">2nd Year</option>
                <option value="3rd-year">3rd Year</option>
                <option value="4th-year">4th Year</option>
              </select>

              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
              >
                <option value="all">All Semesters</option>
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
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="size-8 text-cyan-400 animate-spin" />
            </div>
          ) : filteredNotes.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-slate-900/60 text-slate-400 uppercase text-[10px]">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Folder</th>
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredNotes.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-cyan-300">{n.code}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-400">
                          {n.folder_name ? `📁 ${n.folder_name}` : '— (Root)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white font-bold max-w-xs truncate">
                        {n.title}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{n.file_size || '—'}</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggle(n.id, n.is_active)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono cursor-pointer border ${
                            n.is_active
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          {n.is_active ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setActivePdfNote({
                                title: n.title,
                                code: n.code,
                                pdfUrl: n.pdf_url,
                                fileSize: n.file_size || undefined,
                                year: n.year,
                                semester: n.semester,
                              })
                            }
                            className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-colors"
                            title="Preview PDF"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <a
                            href={n.pdf_url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white transition-colors"
                            title="Download"
                          >
                            <Download className="size-3.5 text-emerald-400" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDelete(n.id, n.title)}
                            className="p-1.5 rounded-lg bg-slate-900 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-400 font-mono text-xs">
              No notes match your filter criteria.
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD NEW SUBJECT */}
      <AnimatePresence>
        {isNewSubjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Add New Subject</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewSubjectModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewSubject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-slate-300">
                    Subject Code * (e.g. CS201, MATH101)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS201"
                    value={newSubjectData.code}
                    onChange={(e) =>
                      setNewSubjectData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-slate-300">
                    Subject Name * (e.g. Data Structures & Algorithms)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures & Algorithms"
                    value={newSubjectData.subject}
                    onChange={(e) =>
                      setNewSubjectData((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-300">Year</label>
                    <select
                      value={newSubjectData.year}
                      onChange={(e) =>
                        setNewSubjectData((prev) => ({ ...prev, year: e.target.value }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                    >
                      <option value="1st-year">1st Year</option>
                      <option value="2nd-year">2nd Year</option>
                      <option value="3rd-year">3rd Year</option>
                      <option value="4th-year">4th Year</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-300">Semester</label>
                    <select
                      value={newSubjectData.semester}
                      onChange={(e) =>
                        setNewSubjectData((prev) => ({ ...prev, semester: e.target.value }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                    >
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
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNewSubjectModalOpen(false)}
                    className="text-xs font-mono"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs"
                  >
                    Open in Drive
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT SUBJECT MODAL */}
      <AnimatePresence>
        {isEditSubjectModalOpen && subjectToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="size-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Edit Subject Details</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditSubjectModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubjectSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-slate-300">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS101, MATH102"
                    value={editSubjectData.newCode}
                    onChange={(e) => setEditSubjectData({ ...editSubjectData, newCode: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-slate-300">
                    Subject Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Data Structures & Algorithms"
                    value={editSubjectData.subject}
                    onChange={(e) => setEditSubjectData({ ...editSubjectData, subject: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-300">Year</label>
                    <select
                      value={editSubjectData.year}
                      onChange={(e) => setEditSubjectData({ ...editSubjectData, year: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                    >
                      <option value="1st-year">1st Year</option>
                      <option value="2nd-year">2nd Year</option>
                      <option value="3rd-year">3rd Year</option>
                      <option value="4th-year">4th Year</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-300">Semester</label>
                    <select
                      value={editSubjectData.semester}
                      onChange={(e) => setEditSubjectData({ ...editSubjectData, semester: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                    >
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
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditSubjectModalOpen(false)}
                    className="text-xs font-mono"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingSubject}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs"
                  >
                    {isSavingSubject ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF VIEWER MODAL */}
      <PdfViewerModal
        note={activePdfNote}
        isOpen={!!activePdfNote}
        onClose={() => setActivePdfNote(null)}
      />
    </div>
  );
}
