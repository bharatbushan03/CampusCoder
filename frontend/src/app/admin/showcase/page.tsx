'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Sparkles, Trash2, Search, ArrowLeft, ExternalLink, 
  Video, Star, CheckCircle, XCircle, Clock, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { CampusCoderLoader } from '@/components/ui/CampusCoderLoader';
import { toast } from 'sonner';

function GithubIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

type ShowcaseAdminRow = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  tech_stack: string[];
  category: string;
  github_url: string | null;
  live_url: string | null;
  demo_video_url: string | null;
  author_id: string | null;
  author_name: string;
  author_email: string | null;
  author_college: string | null;
  author_branch: string | null;
  author_year: string | null;
  stars: number;
  featured: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export default function AdminShowcasePage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ShowcaseAdminRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadProjects = async () => {
    try {
      const data = await api<{ ok: boolean; projects: ShowcaseAdminRow[] }>('/admin/showcase');
      setProjects(data.projects || []);
    } catch (err: any) {
      console.warn('Error loading showcase projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      await api(`/admin/showcase/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Project status updated to ${newStatus}`);
      await loadProjects();
    } catch (err: any) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      await api(`/admin/showcase/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ featured: !currentFeatured }),
      });
      toast.success(!currentFeatured ? 'Project featured!' : 'Project unfeatured');
      await loadProjects();
    } catch (err: any) {
      toast.error('Failed to toggle featured: ' + err.message);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the project "${title}"?`)) return;
    try {
      await api(`/admin/showcase/${id}`, { method: 'DELETE' });
      toast.success('Project deleted successfully');
      await loadProjects();
    } catch (err: any) {
      toast.error('Failed to delete project: ' + err.message);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author_college?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <CampusCoderLoader text="Loading showcase submissions" />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
            <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Console
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono flex items-center gap-2.5">
            <Sparkles className="size-7 text-emerald-400" /> Student Showcase
          </h1>
          <p className="text-sm text-slate-400">Review student project submissions, manage approvals, and spotlight featured work.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/showcase" target="_blank">
            <Button variant="secondary" className="flex items-center gap-1.5 text-xs">
              <ExternalLink className="size-3.5" /> View Live Showcase
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, student, college, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'approved', 'pending', 'rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12 text-center border-slate-900 bg-slate-950/20">
          <Sparkles className="size-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-mono text-sm">No showcase projects found.</p>
          <p className="text-slate-600 text-xs mt-1">When students submit projects, they will be listed here.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map((project) => {
            const isApproved = project.status === 'approved';
            const isPending = project.status === 'pending';
            const isRejected = project.status === 'rejected';

            return (
              <Card key={project.id} className="p-6 border-slate-800/80 bg-slate-900/50 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  
                  {/* Info Area */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default" className="text-[10px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                        {project.category}
                      </Badge>
                      
                      {project.featured && (
                        <Badge variant="default" className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border-amber-500/30 flex items-center gap-1">
                          <Star className="size-2.5 fill-amber-300" /> Featured
                        </Badge>
                      )}

                      <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                        isApproved
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isPending
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {isApproved && <CheckCircle className="size-3" />}
                        {isPending && <Clock className="size-3" />}
                        {isRejected && <XCircle className="size-3" />}
                        {project.status}
                      </span>

                      <span className="text-slate-500 text-xs font-mono">
                        Submitted: {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-white font-mono">{project.title}</h2>
                    <p className="text-xs text-slate-300 italic">{project.tagline}</p>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mt-2 whitespace-pre-line bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                      {project.description}
                    </p>

                    {/* Author and College */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <ShieldCheck className="size-3.5" />
                        <span>{project.author_name}</span>
                      </div>
                      {project.author_email && (
                        <span className="text-slate-400 font-mono">({project.author_email})</span>
                      )}
                      {project.author_college && (
                        <span className="text-slate-400">• {project.author_college}</span>
                      )}
                      {(project.author_branch || project.author_year) && (
                        <span className="text-slate-500">
                          • {[project.author_branch, project.author_year ? `Yr ${project.author_year}` : ''].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </div>

                    {/* Tech Stack */}
                    {Array.isArray(project.tech_stack) && project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {project.tech_stack.map((tech) => (
                          <span key={tech} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {project.live_url && (
                        <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline">
                          <ExternalLink className="size-3.5" /> Live Demo
                        </a>
                      )}
                      {project.github_url && (
                        <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-300 hover:underline">
                          <GithubIcon className="size-3.5" /> GitHub Repo
                        </a>
                      )}
                      {project.demo_video_url && (
                        <a href={project.demo_video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline">
                          <Video className="size-3.5" /> Video Demo
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0">
                    <Button
                      variant="secondary"
                      onClick={() => handleToggleFeatured(project.id, project.featured)}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Star className={`size-3.5 ${project.featured ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                      {project.featured ? 'Unfeature' : 'Feature'}
                    </Button>

                    {project.status !== 'approved' && (
                      <Button
                        variant="primary"
                        onClick={() => handleUpdateStatus(project.id, 'approved')}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <CheckCircle className="size-3.5" /> Approve
                      </Button>
                    )}

                    {project.status !== 'rejected' && (
                      <Button
                        variant="secondary"
                        onClick={() => handleUpdateStatus(project.id, 'rejected')}
                        className="text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5"
                      >
                        <XCircle className="size-3.5" /> Reject
                      </Button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(project.id, project.title)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
