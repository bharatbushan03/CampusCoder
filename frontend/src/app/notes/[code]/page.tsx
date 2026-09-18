'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { 
  DriveExplorer, 
  type NoteFolder, 
  type NoteDocument, 
  type SubjectMetadata 
} from '@/components/notes/DriveExplorer';
import { 
  createNoteFolder, 
  updateNoteFolder, 
  deleteNoteFolder, 
  deleteNote, 
  batchCreateNotes 
} from '@/app/actions/adminActions';

export default function SubjectNotesPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const isAdminOrOrganizer = Boolean(user && profile && (profile.role === 'admin' || profile.role === 'organizer'));
  const { code } = useParams<{ code: string }>();

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<NoteDocument[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);

  const fetchSubjectData = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    try {
      const [notesRes, foldersRes] = await Promise.all([
        api<{ ok: boolean; notes: any[] }>(`/notes?code=${encodeURIComponent(code)}`),
        api<{ ok: boolean; folders: any[] }>(`/notes/folders?code=${encodeURIComponent(code)}`),
      ]);

      if (notesRes && notesRes.ok && Array.isArray(notesRes.notes)) {
        const mappedDocs: NoteDocument[] = notesRes.notes.map((n: any) => ({
          id: n.id,
          title: n.title,
          code: n.code || code,
          subject: n.subject || n.title,
          year: n.year || '1st-year',
          semester: n.semester || 'sem-1',
          branch: n.branch || 'All Branches',
          description: n.description || '',
          pdf_url: n.pdf_url,
          file_size: n.file_size || 'PDF Document',
          page_count: n.page_count || undefined,
          author: n.author || undefined,
          folder_id: n.folder_id || null,
          folder_name: n.folder_name || null,
          tags: Array.isArray(n.tags) ? n.tags : [],
          is_active: n.is_active ?? true,
          created_at: n.created_at,
        }));
        setDocuments(mappedDocs);
      } else {
        setDocuments([]);
      }

      if (foldersRes && foldersRes.ok && Array.isArray(foldersRes.folders)) {
        setFolders(foldersRes.folders);
      } else {
        setFolders([]);
      }
    } catch (err) {
      console.error('Error fetching subject drive data:', err);
      setDocuments([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void fetchSubjectData();
  }, [fetchSubjectData]);

  // Derive subject metadata
  const subjectMetadata: SubjectMetadata = useMemo(() => {
    const firstDoc = documents[0];
    return {
      code: code || 'Subject',
      subject: firstDoc?.subject || firstDoc?.title || code || 'Subject Notes',
      year: firstDoc?.year,
      semester: firstDoc?.semester,
      branch: firstDoc?.branch || 'All Branches',
    };
  }, [documents, code]);

  // Admin folder actions
  const handleCreateFolder = async (name: string, parentId: string | null, color?: string) => {
    if (!code) return false;
    const res = await createNoteFolder({
      name,
      subject_code: code,
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
    if (!code) return false;
    const res = await batchCreateNotes({
      code,
      subject: subjectMetadata.subject,
      year: (subjectMetadata.year as any) || '1st-year',
      semester: subjectMetadata.semester || 'sem-1',
      branch: subjectMetadata.branch || 'All Branches',
      folder_id: folderId,
      folder_name: folderName,
      files,
    });
    return res.success;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <DriveExplorer
        subject={subjectMetadata}
        folders={folders}
        documents={documents}
        isAdmin={isAdminOrOrganizer}
        loading={loading}
        onRefresh={fetchSubjectData}
        onCreateFolder={isAdminOrOrganizer ? handleCreateFolder : undefined}
        onRenameFolder={isAdminOrOrganizer ? handleRenameFolder : undefined}
        onDeleteFolder={isAdminOrOrganizer ? handleDeleteFolder : undefined}
        onDeleteDocument={isAdminOrOrganizer ? handleDeleteDocument : undefined}
        onBatchUpload={isAdminOrOrganizer ? handleBatchUpload : undefined}
        onBackToSubjects={() => router.push('/resources?category=notes')}
      />
    </div>
  );
}