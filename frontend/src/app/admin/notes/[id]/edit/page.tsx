'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, 
  ArrowLeft, 
  Loader2, 
  Plus, 
  FileText, 
  Check, 
  Trash2, 
  Link as LinkIcon 
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { updateNote } from '@/app/actions/adminActions';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    subject: '',
    year: '1st-year' as '1st-year' | '2nd-year' | '3rd-year' | '4th-year',
    semester: 'sem-1',
    branch: 'All Branches',
    description: '',
    pdf_url: '',
    file_size: '',
    page_count: '',
    author: 'CampusCoder Academic Team',
    tags: '',
    highlights: '',
    is_active: true,
  });

  const [topics, setTopics] = useState<Array<{ title: string; subtopics: string }>>([
    { title: 'Module 1: Fundamental Concepts', subtopics: 'Core principles, Definitions, Foundational theorems' }
  ]);

  useEffect(() => {
    async function loadNote() {
      try {
        const res = await api<{ ok: boolean; note: any }>(`/admin/notes/${id}`);
        if (res && res.ok && res.note) {
          const n = res.note;
          setFormData({
            title: n.title || '',
            code: n.code || '',
            subject: n.subject || '',
            year: n.year || '1st-year',
            semester: n.semester || 'sem-1',
            branch: n.branch || 'All Branches',
            description: n.description || '',
            pdf_url: n.pdf_url || '',
            file_size: n.file_size || '',
            page_count: n.page_count ? String(n.page_count) : '',
            author: n.author || 'CampusCoder Academic Team',
            tags: Array.isArray(n.tags) ? n.tags.join(', ') : '',
            highlights: Array.isArray(n.highlights) ? n.highlights.join('\n') : '',
            is_active: n.is_active ?? true,
          });

          if (Array.isArray(n.topics) && n.topics.length > 0) {
            setTopics(n.topics.map((t: any) => ({
              title: t.title || '',
              subtopics: Array.isArray(t.subtopics) ? t.subtopics.join(', ') : ''
            })));
          }
        }
      } catch (err: any) {
        toast.error('Failed to load note: ' + (err.message || 'Error'));
      } finally {
        setLoading(false);
      }
    }

    void loadNote();
  }, [id]);

  const handleAddTopic = () => {
    setTopics(prev => [...prev, { title: '', subtopics: '' }]);
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(prev => prev.filter((_, i) => i !== index));
  };

  const handleTopicChange = (index: number, field: 'title' | 'subtopics', value: string) => {
    setTopics(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      toast.error('Only PDF documents are allowed');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      toast.error('PDF file size must be less than 30MB');
      return;
    }

    setUploadingPdf(true);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/admin/upload/pdf', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to upload PDF');
      }

      setFormData(prev => ({
        ...prev,
        pdf_url: data.url,
        file_size: data.fileSize || `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      }));

      toast.success('New PDF uploaded and linked!');
    } catch (err: any) {
      toast.error('Upload failed: ' + (err.message || 'Error'));
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Subject title is required');
      return;
    }

    if (!formData.code.trim()) {
      toast.error('Subject code is required');
      return;
    }

    if (!formData.pdf_url.trim()) {
      toast.error('Please upload a PDF or provide a valid PDF link');
      return;
    }

    setSubmitting(true);
    try {
      const parsedTopics = topics
        .filter(t => t.title.trim())
        .map(t => ({
          title: t.title.trim(),
          subtopics: t.subtopics.split(',').map(s => s.trim()).filter(Boolean)
        }));

      const payload = {
        title: formData.title.trim(),
        code: formData.code.trim().toUpperCase(),
        subject: formData.subject.trim() || formData.title.trim(),
        year: formData.year,
        semester: formData.semester,
        branch: formData.branch.trim() || 'All Branches',
        description: formData.description.trim() || null,
        pdf_url: formData.pdf_url.trim(),
        file_size: formData.file_size.trim() || 'PDF Document',
        page_count: formData.page_count ? parseInt(formData.page_count, 10) : null,
        author: formData.author.trim() || null,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        highlights: formData.highlights.split('\n').map(h => h.trim()).filter(Boolean),
        topics: parsedTopics,
        is_active: formData.is_active,
      };

      await updateNote(id, payload);
      toast.success('Subject handbook updated successfully!');
      router.push('/admin/notes');
    } catch (err: any) {
      toast.error('Failed to update note: ' + (err.message || 'Validation error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-3">
        <Loader2 className="size-8 text-blue-400 animate-spin mx-auto" />
        <p className="text-xs font-mono text-slate-400">Loading subject handbook details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <Link 
          href="/admin/notes" 
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Notes Management
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
          <GraduationCap className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">Edit Academic Handbook</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Modify subject metadata, update syllabus modules, or replace the attached PDF file.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PDF File Upload Zone */}
        <Card className="p-6 bg-slate-950/80 border-blue-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-blue-400 font-mono flex items-center gap-2">
              <FileText className="size-4" /> 1. PDF Document Link & Replacement
            </h2>
            <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
              Max 30MB • PDF
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-2xl p-6 text-center transition-colors bg-slate-900/30 flex flex-col items-center justify-center min-h-[160px]">
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handlePdfFileUpload}
                disabled={uploadingPdf}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
              />
              {uploadingPdf ? (
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="size-8 text-blue-400 animate-spin" />
                  <p className="text-xs font-mono text-slate-300">Uploading new PDF...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2 text-emerald-400">
                  <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    <Check className="size-6" />
                  </div>
                  <p className="text-xs font-mono font-bold">PDF Attached</p>
                  <p className="text-[11px] font-mono text-slate-400">Click or drop to replace with new PDF</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Direct PDF URL *
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="url"
                    value={formData.pdf_url}
                    onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    File Size Display
                  </label>
                  <input
                    type="text"
                    value={formData.file_size}
                    onChange={(e) => setFormData({ ...formData, file_size: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Total Pages
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.page_count}
                    onChange={(e) => setFormData({ ...formData, page_count: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Author / Professor / Source
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Primary Subject Details */}
        <Card className="p-6 bg-slate-950/60 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono">2. Subject & Academic Hierarchy</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Subject Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Subject Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 uppercase focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Subject Name
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Academic Year *
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="1st-year">1st Year (Freshmen)</option>
                <option value="2nd-year">2nd Year (Sophomore)</option>
                <option value="3rd-year">3rd Year (Junior)</option>
                <option value="4th-year">4th Year (Senior)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Semester *
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
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

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Eligible Branch
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Description & Syllabus Scope
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </Card>

        {/* Modules & Covered Topics */}
        <Card className="p-6 bg-slate-950/60 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white font-mono">3. Modules & Covered Topics</h2>
              <p className="text-[11px] text-slate-400">Chapters and topics detailed inside this PDF.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTopic}
              className="text-xs font-mono border-slate-700 text-blue-400"
            >
              <Plus className="size-3.5 mr-1" /> Add Module
            </Button>
          </div>

          <div className="space-y-3">
            {topics.map((top, idx) => (
              <div key={idx} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder={`Module ${idx + 1} Title`}
                    value={top.title}
                    onChange={(e) => handleTopicChange(idx, 'title', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500/50"
                  />
                  {topics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove module"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Subtopics (comma separated)"
                  value={top.subtopics}
                  onChange={(e) => handleTopicChange(idx, 'subtopics', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Highlights & Visibility */}
        <Card className="p-6 bg-slate-950/60 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono">4. Highlights & Visibility</h2>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Handbook Highlights (1 per line)
            </label>
            <textarea
              rows={3}
              value={formData.highlights}
              onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 font-mono"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-blue-500/20"
            />
            <label htmlFor="is_active" className="text-xs text-slate-300 font-mono cursor-pointer">
              Active and visible to students in Resources & Notes
            </label>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link href="/admin/notes">
            <Button variant="outline" type="button" className="border-slate-800 text-xs font-mono">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting || uploadingPdf}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs px-6"
          >
            {submitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" /> Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
