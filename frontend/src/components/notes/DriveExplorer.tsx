'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  Folder, 
  FolderPlus, 
  UploadCloud, 
  FileText, 
  ChevronRight, 
  Search, 
  Grid, 
  List, 
  Download, 
  Eye, 
  Trash2, 
  Edit3, 
  MoreVertical, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  BookOpen, 
  CornerDownRight, 
  ArrowLeft,
  Image as ImageIcon,
  Presentation,
  FileSpreadsheet,
  FileArchive,
  FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { PdfViewerModal, type PdfViewerData } from '@/components/resources/PdfViewerModal';
import { Button } from '@/components/ui/Button';

export interface NoteFolder {
  id: string;
  subject_code: string;
  name: string;
  parent_id: string | null;
  color: string | null;
  created_at: string;
  document_count?: number;
}

export interface NoteDocument {
  id: string;
  title: string;
  code: string;
  subject?: string | null;
  year: string;
  semester: string;
  branch?: string | null;
  description?: string | null;
  pdf_url?: string;
  file_size?: string | null;
  page_count?: number | null;
  author?: string | null;
  folder_id?: string | null;
  folder_name?: string | null;
  tags?: string[];
  is_active: boolean;
  created_at?: string;
}

export interface SubjectMetadata {
  code: string;
  subject: string;
  year?: string;
  semester?: string;
  branch?: string;
}

interface DriveExplorerProps {
  subject: SubjectMetadata;
  folders: NoteFolder[];
  documents: NoteDocument[];
  isAdmin?: boolean;
  loading?: boolean;
  onRefresh: () => Promise<void> | void;
  onCreateFolder?: (name: string, parentId: string | null, color?: string) => Promise<boolean>;
  onRenameFolder?: (folderId: string, newName: string) => Promise<boolean>;
  onDeleteFolder?: (folderId: string) => Promise<boolean>;
  onDeleteDocument?: (docId: string) => Promise<boolean>;
  onBatchUpload?: (
    files: Array<{ title: string; pdf_url: string; file_size: string }>,
    folderId: string | null,
    folderName: string | null
  ) => Promise<boolean>;
  onBackToSubjects?: () => void;
}

export function getDocTypeInfo(doc: NoteDocument) {
  const source = (doc.pdf_url || doc.title).toLowerCase();
  const ext = (source.split('?')[0].split('.').pop() || '').toLowerCase();

  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    return {
      label: ext.toUpperCase(),
      icon: ImageIcon,
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
    };
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return {
      label: 'PPT',
      icon: Presentation,
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
    };
  }
  if (['doc', 'docx'].includes(ext)) {
    return {
      label: 'DOC',
      icon: FileText,
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
    };
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return {
      label: 'SHEET',
      icon: FileSpreadsheet,
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
    };
  }
  if (['zip', 'rar', '7z'].includes(ext)) {
    return {
      label: 'ZIP',
      icon: FileArchive,
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
    };
  }
  if (['txt', 'md', 'json', 'py', 'js', 'ts', 'java', 'cpp'].includes(ext)) {
    return {
      label: ext.toUpperCase(),
      icon: FileCode,
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/30',
      text: 'text-sky-400',
    };
  }
  return {
    label: ext ? ext.toUpperCase() : 'PDF',
    icon: FileText,
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
  };
}

export function DriveExplorer({
  subject,
  folders,
  documents,
  isAdmin = false,
  loading = false,
  onRefresh,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onDeleteDocument,
  onBatchUpload,
  onBackToSubjects,
}: DriveExplorerProps) {
  // Navigation state: currentFolder is null for root level of subject
  const [currentFolder, setCurrentFolder] = useState<NoteFolder | null>(null);
  const [folderHistory, setFolderHistory] = useState<NoteFolder[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('cyan');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<NoteFolder | null>(null);
  const [renamedName, setRenamedName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState(false);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, 'pending' | 'uploading' | 'done' | 'error'>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // PDF Preview
  const [activePdf, setActivePdf] = useState<PdfViewerData | null>(null);

  // Active kebab menu
  const [activeMenuFolderId, setActiveMenuFolderId] = useState<string | null>(null);

  // Folders to display: children of currentFolder (or root if currentFolder is null)
  const displayedFolders = useMemo(() => {
    return folders.filter((f) => {
      const matchesParent = currentFolder ? f.parent_id === currentFolder.id : !f.parent_id;
      if (!matchesParent) return false;
      if (!search.trim()) return true;
      return f.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [folders, currentFolder, search]);

  // Documents to display: documents in currentFolder (or root if currentFolder is null)
  const displayedDocuments = useMemo(() => {
    return documents.filter((d) => {
      const matchesFolder = currentFolder ? d.folder_id === currentFolder.id : !d.folder_id;
      if (!matchesFolder) return false;
      if (!search.trim()) return true;
      return (
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(search.toLowerCase())) ||
        (d.tags && d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())))
      );
    });
  }, [documents, currentFolder, search]);

  // Folder navigation handlers
  const handleOpenFolder = (folder: NoteFolder) => {
    setFolderHistory((prev) => [...prev, folder]);
    setCurrentFolder(folder);
    setSearch('');
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Root level
      setCurrentFolder(null);
      setFolderHistory([]);
    } else {
      const targetFolder = folderHistory[index];
      setCurrentFolder(targetFolder);
      setFolderHistory((prev) => prev.slice(0, index + 1));
    }
    setSearch('');
  };

  const handleNavigateUp = () => {
    if (folderHistory.length > 0) {
      const newHistory = [...folderHistory];
      newHistory.pop();
      setFolderHistory(newHistory);
      setCurrentFolder(newHistory.length > 0 ? newHistory[newHistory.length - 1] : null);
    }
  };

  // Create folder action
  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !onCreateFolder) return;

    setCreatingFolder(true);
    try {
      const ok = await onCreateFolder(
        newFolderName.trim(),
        currentFolder ? currentFolder.id : null,
        newFolderColor
      );
      if (ok) {
        toast.success(`Folder "${newFolderName.trim()}" created!`);
        setNewFolderName('');
        setIsCreateFolderOpen(false);
        await onRefresh();
      }
    } catch (err: any) {
      toast.error('Failed to create folder: ' + (err.message || 'Error'));
    } finally {
      setCreatingFolder(false);
    }
  };

  // Rename folder action
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderToRename || !renamedName.trim() || !onRenameFolder) return;

    setRenamingFolder(true);
    try {
      const ok = await onRenameFolder(folderToRename.id, renamedName.trim());
      if (ok) {
        toast.success('Folder renamed successfully!');
        setIsRenameModalOpen(false);
        setFolderToRename(null);
        await onRefresh();
      }
    } catch (err: any) {
      toast.error('Failed to rename folder: ' + (err.message || 'Error'));
    } finally {
      setRenamingFolder(false);
    }
  };

  // Delete folder action
  const handleDeleteFolderClick = async (folder: NoteFolder) => {
    if (!onDeleteFolder) return;
    if (!window.confirm(`Delete folder "${folder.name}"? Documents inside will be moved to the subject root.`)) return;

    try {
      const ok = await onDeleteFolder(folder.id);
      if (ok) {
        toast.success(`Deleted folder "${folder.name}"`);
        if (currentFolder?.id === folder.id) {
          handleNavigateUp();
        }
        await onRefresh();
      }
    } catch (err: any) {
      toast.error('Failed to delete folder: ' + (err.message || 'Error'));
    }
  };

  // Delete document action
  const handleDeleteDocClick = async (doc: NoteDocument) => {
    if (!onDeleteDocument) return;
    if (!window.confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

    try {
      const ok = await onDeleteDocument(doc.id);
      if (ok) {
        toast.success(`Deleted "${doc.title}"`);
        await onRefresh();
      }
    } catch (err: any) {
      toast.error('Failed to delete document: ' + (err.message || 'Error'));
    }
  };

  const DISALLOWED_EXTENSIONS = new Set([
    '.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.dll', '.vbs', '.com', '.scr', '.pif'
  ]);

  // Multi-file selection (supports PDF, PPT, Word, Excel, Images, Text, ZIP, etc.)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const f of files) {
      const ext = f.name.includes('.') ? f.name.substring(f.name.lastIndexOf('.')).toLowerCase() : '';
      if (DISALLOWED_EXTENSIONS.has(ext)) {
        toast.error(`"${f.name}": Executable file types are not allowed.`);
        continue;
      }
      if (f.size > 30 * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds 30MB limit (${(f.size / (1024 * 1024)).toFixed(1)}MB)`);
        continue;
      }
      validFiles.push(f);
    }

    setUploadFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Execute upload of selected files
  const handleExecuteUpload = async () => {
    if (uploadFiles.length === 0 || !onBatchUpload) return;

    setIsUploading(true);
    const uploadedDocs: Array<{ title: string; pdf_url: string; file_size: string }> = [];

    for (const file of uploadFiles) {
      setUploadProgress((prev) => ({ ...prev, [file.name]: 'uploading' }));
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/upload/pdf', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
        const titleWithoutExt = ext ? file.name.slice(0, -ext.length) : file.name;

        uploadedDocs.push({
          title: titleWithoutExt.replace(/_/g, ' ') || file.name,
          pdf_url: data.url,
          file_size: data.fileSize || `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        });

        setUploadProgress((prev) => ({ ...prev, [file.name]: 'done' }));
      } catch (err: any) {
        console.error('File upload error:', err);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 'error' }));
        toast.error(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    if (uploadedDocs.length > 0) {
      try {
        const ok = await onBatchUpload(
          uploadedDocs,
          currentFolder ? currentFolder.id : null,
          currentFolder ? currentFolder.name : null
        );
        if (ok) {
          toast.success(`Successfully uploaded ${uploadedDocs.length} document(s)!`);
          setUploadFiles([]);
          setUploadProgress({});
          setIsUploadOpen(false);
          await onRefresh();
        }
      } catch (err: any) {
        toast.error('Failed to link documents: ' + err.message);
      }
    }

    setIsUploading(false);
  };

  // Color map for folder styles
  const folderColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20 hover:border-cyan-400/50', text: 'text-cyan-300', icon: 'text-cyan-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20 hover:border-amber-400/50', text: 'text-amber-300', icon: 'text-amber-400' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20 hover:border-emerald-400/50', text: 'text-emerald-300', icon: 'text-emerald-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20 hover:border-purple-400/50', text: 'text-purple-300', icon: 'text-purple-400' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20 hover:border-blue-400/50', text: 'text-blue-300', icon: 'text-blue-400' },
  };

  return (
    <div className="w-full space-y-5">
      {/* Subject Header & Quick Info */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0b101b]/90 p-5 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {onBackToSubjects && (
                <button
                  type="button"
                  onClick={onBackToSubjects}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:border-cyan-500/30 transition-all cursor-pointer mr-1"
                >
                  <ArrowLeft className="size-3.5" /> All Subjects
                </button>
              )}
              <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300">
                {subject.code}
              </span>
              {subject.year && (
                <span className="text-[11px] font-mono text-slate-400">
                  {subject.year.replace('-', ' ')}
                </span>
              )}
              {subject.semester && (
                <span className="text-[11px] font-mono text-slate-500">
                  • {subject.semester.replace('-', ' ')}
                </span>
              )}
              {subject.branch && (
                <span className="text-[11px] font-mono text-slate-500">
                  • {subject.branch}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {subject.subject || subject.code}
            </h2>
          </div>

          {/* Admin Primary Actions */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => setIsCreateFolderOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-mono text-xs font-semibold gap-1.5"
              >
                <FolderPlus className="size-4" /> New Folder
              </Button>
              <Button
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold gap-1.5 shadow-sm"
              >
                <UploadCloud className="size-4" /> Upload Document(s)
              </Button>
            </div>
          )}
        </div>

        {/* Google Drive Breadcrumb Path Bar */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto border-t border-white/[0.06] pt-4 pb-1 text-xs font-mono text-slate-400">
          <button
            type="button"
            onClick={() => handleBreadcrumbClick(-1)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              !currentFolder
                ? 'bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20'
                : 'hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <BookOpen className="size-3.5" />
            <span>{subject.code} (Root)</span>
          </button>

          {folderHistory.map((folder, index) => {
            const isLast = index === folderHistory.length - 1;
            return (
              <React.Fragment key={folder.id}>
                <ChevronRight className="size-3.5 text-slate-600 shrink-0" />
                <button
                  type="button"
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    isLast
                      ? 'bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Folder className="size-3.5 text-cyan-400" />
                  <span>{folder.name}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Drive Action Bar: Search, View Mode, Count */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            type="text"
            placeholder={`Search in ${currentFolder ? currentFolder.name : subject.code}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-xs font-mono text-slate-500">
            {displayedFolders.length} folder{displayedFolders.length !== 1 ? 's' : ''} • {displayedDocuments.length} file{displayedDocuments.length !== 1 ? 's' : ''}
          </span>

          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-800 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid view"
            >
              <Grid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-slate-800 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="List view"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Explorer Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 rounded-2xl border border-white/[0.08] bg-[#0b101b]/60">
          <Loader2 className="size-8 text-cyan-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading Drive contents...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: FOLDERS */}
          {displayedFolders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Folder className="size-4 text-cyan-400" /> Folders
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {displayedFolders.map((folder) => {
                  const style = folderColors[folder.color || 'cyan'] || folderColors.cyan;
                  return (
                    <div
                      key={folder.id}
                      onClick={() => handleOpenFolder(folder)}
                      className={`group relative flex items-center justify-between p-3.5 rounded-xl border ${style.border} ${style.bg} hover:bg-slate-900/90 transition-all cursor-pointer shadow-md`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <Folder className={`size-5 ${style.icon} shrink-0`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                            {folder.name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {folder.document_count || 0} document{(folder.document_count || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Admin Kebab Menu */}
                      {isAdmin && (
                        <div
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuFolderId(activeMenuFolderId === folder.id ? null : folder.id)
                            }
                            className="p-1 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
                          >
                            <MoreVertical className="size-4" />
                          </button>

                          {activeMenuFolderId === folder.id && (
                            <div className="absolute right-0 top-8 z-30 w-36 rounded-xl border border-slate-700 bg-slate-950 p-1.5 shadow-2xl space-y-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuFolderId(null);
                                  setFolderToRename(folder);
                                  setRenamedName(folder.name);
                                  setIsRenameModalOpen(true);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-900 hover:text-white transition-colors text-left"
                              >
                                <Edit3 className="size-3.5" /> Rename
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuFolderId(null);
                                  void handleDeleteFolderClick(folder);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                              >
                                <Trash2 className="size-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: DOCUMENTS */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="size-4 text-emerald-400" /> Files & Documents
            </h3>

            {displayedDocuments.length === 0 && displayedFolders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center space-y-4">
                <div className="size-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mx-auto flex items-center justify-center text-cyan-400">
                  <Folder className="size-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">This folder is empty</h4>
                  <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
                    {isAdmin
                      ? 'Create subfolders or upload PDF study materials directly into this folder.'
                      : 'No documents have been uploaded to this folder yet.'}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                    <Button
                      size="sm"
                      onClick={() => setIsCreateFolderOpen(true)}
                      className="bg-slate-900 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-semibold"
                    >
                      <FolderPlus className="size-3.5 mr-1.5" /> Create Folder
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsUploadOpen(true)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-bold shadow-sm"
                    >
                      <UploadCloud className="size-3.5 mr-1.5" /> Upload Document(s)
                    </Button>
                  </div>
                )}
              </div>
            ) : displayedDocuments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800/80 bg-slate-950/30 p-6 text-center text-xs font-mono text-slate-500">
                No direct files in this level. Open a folder above to view documents.
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedDocuments.map((doc) => {
                  const typeInfo = getDocTypeInfo(doc);
                  const DocIcon = typeInfo.icon;
                  return (
                    <div
                      key={doc.id}
                      className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-lg hover:border-cyan-500/40 hover:bg-slate-900/60 transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className={`rounded-xl ${typeInfo.bg} border ${typeInfo.border} p-2.5 ${typeInfo.text}`}>
                          <DocIcon className="size-6" strokeWidth={1.8} />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${typeInfo.bg} ${typeInfo.text} border ${typeInfo.border}`}>
                            {typeInfo.label}
                          </span>
                          {doc.file_size && (
                            <span className="rounded-md bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                              {doc.file_size}
                            </span>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteDocClick(doc)}
                              className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete file"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mt-4 space-y-1.5 flex-1">
                        <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
                          {doc.title}
                        </h4>
                        {doc.description && (
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActivePdf({
                              title: doc.title,
                              code: doc.code,
                              pdfUrl: doc.pdf_url || '',
                              fileSize: doc.file_size || undefined,
                              year: doc.year,
                              semester: doc.semester,
                            })
                          }
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 font-mono text-xs font-semibold border border-cyan-500/20 transition-all cursor-pointer"
                        >
                          <Eye className="size-3.5" />
                          <span>Preview</span>
                        </button>

                        <a
                          href={doc.pdf_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Download className="size-3.5 text-emerald-400" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-slate-900/50 text-slate-400 uppercase text-[10px]">
                      <th className="py-3 px-4">Document Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {displayedDocuments.map((doc) => {
                      const typeInfo = getDocTypeInfo(doc);
                      const DocIcon = typeInfo.icon;
                      return (
                        <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <DocIcon className={`size-4 ${typeInfo.text} shrink-0`} />
                              <span className="font-bold text-white text-xs truncate max-w-sm">
                                {doc.title}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${typeInfo.bg} ${typeInfo.text} ${typeInfo.border}`}>
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{doc.file_size || '—'}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setActivePdf({
                                    title: doc.title,
                                    code: doc.code,
                                    pdfUrl: doc.pdf_url || '',
                                    fileSize: doc.file_size || undefined,
                                    year: doc.year,
                                    semester: doc.semester,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-colors"
                                title="Preview"
                              >
                                <Eye className="size-3.5" />
                              </button>
                              <a
                                href={doc.pdf_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white transition-colors"
                                title="Download"
                              >
                                <Download className="size-3.5 text-emerald-400" />
                              </a>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteDocClick(doc)}
                                  className="p-1.5 rounded-lg bg-slate-900 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW FOLDER */}
      <AnimatePresence>
        {isCreateFolderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <FolderPlus className="size-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Create New Folder</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-slate-300">
                    Folder Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 1: Linear Data Structures, PYQs..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                  <p className="text-[11px] font-mono text-slate-500">
                    Location: {currentFolder ? `${subject.code} > ${currentFolder.name}` : `${subject.code} (Root)`}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-slate-300">
                    Folder Accent Color
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    {Object.keys(folderColors).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewFolderColor(c)}
                        className={`size-7 rounded-full border-2 transition-transform cursor-pointer ${
                          c === 'cyan' ? 'bg-cyan-500' :
                          c === 'amber' ? 'bg-amber-500' :
                          c === 'emerald' ? 'bg-emerald-500' :
                          c === 'purple' ? 'bg-purple-500' : 'bg-blue-500'
                        } ${newFolderColor === c ? 'scale-115 border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateFolderOpen(false)}
                    className="text-xs font-mono"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={creatingFolder || !newFolderName.trim()}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs shadow-sm"
                  >
                    {creatingFolder ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                    Create Folder
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: RENAME FOLDER */}
      <AnimatePresence>
        {isRenameModalOpen && folderToRename && (
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
                  <h3 className="text-base font-bold text-white">Rename Folder</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleRenameSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-slate-300">
                    New Folder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={renamedName}
                    onChange={(e) => setRenamedName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRenameModalOpen(false)}
                    className="text-xs font-mono"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={renamingFolder || !renamedName.trim()}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs"
                  >
                    {renamingFolder ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                    Save Name
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: BATCH UPLOAD DOCUMENTS (UP TO 30MB) */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <UploadCloud className="size-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Upload Document(s)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isUploading) {
                      setIsUploadOpen(false);
                      setUploadFiles([]);
                    }
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Destination note */}
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 flex items-center gap-2 text-xs font-mono text-cyan-300">
                  <CornerDownRight className="size-4 shrink-0" />
                  <span>
                    Destination:{' '}
                    <strong>
                      {currentFolder ? `${subject.code} / ${currentFolder.name}` : `${subject.code} (Subject Root)`}
                    </strong>
                  </span>
                </div>

                {/* Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-900/40 p-8 text-center space-y-3 cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,.gif,.svg,.zip,.rar,.7z,application/*,image/*,text/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
                    <UploadCloud className="size-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Click or drag & drop files</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-1">PDF, PPT, Word, Excel, Images, Text, ZIP (up to 30MB each)</p>
                  </div>
                </div>

                {/* Selected Files List */}
                {uploadFiles.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    <p className="text-xs font-mono text-slate-400 font-bold">
                      Files to upload ({uploadFiles.length}):
                    </p>
                    {uploadFiles.map((file, idx) => {
                      const status = uploadProgress[file.name] || 'pending';
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs font-mono"
                        >
                          <div className="flex items-center gap-2.5 truncate pr-2">
                            <FileText className="size-4 text-emerald-400 shrink-0" />
                            <span className="truncate text-slate-200">{file.name}</span>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                            </span>
                          </div>

                          <div className="shrink-0">
                            {status === 'uploading' && <Loader2 className="size-4 text-cyan-400 animate-spin" />}
                            {status === 'done' && <CheckCircle2 className="size-4 text-emerald-400" />}
                            {status === 'error' && <AlertCircle className="size-4 text-rose-400" />}
                            {status === 'pending' && !isUploading && (
                              <button
                                type="button"
                                onClick={() => setUploadFiles((prev) => prev.filter((_, i) => i !== idx))}
                                className="text-slate-500 hover:text-rose-400"
                              >
                                <X className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => {
                      setIsUploadOpen(false);
                      setUploadFiles([]);
                    }}
                    className="text-xs font-mono"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isUploading || uploadFiles.length === 0}
                    onClick={handleExecuteUpload}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs shadow-sm"
                  >
                    {isUploading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                    Upload {uploadFiles.length} File{uploadFiles.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF VIEWER MODAL */}
      <PdfViewerModal
        isOpen={Boolean(activePdf)}
        note={activePdf}
        onClose={() => setActivePdf(null)}
      />
    </div>
  );
}
