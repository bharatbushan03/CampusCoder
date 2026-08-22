'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, Code2, ExternalLink, Video, Plus, Search, 
  CheckCircle2, X, Loader2, ShieldCheck, 
  Terminal, ArrowUpRight, Filter, Heart
} from 'lucide-react';
import { AnimatedSection } from '@/components/animations/ScrollAnimations';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';

function GithubIcon({ className = 'size-4' }: { className?: string }) {
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

type ShowcaseProject = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  techStack: string[];
  category: string;
  githubUrl?: string | null;
  liveUrl?: string | null;
  demoVideoUrl?: string | null;
  authorName: string;
  authorCollege?: string | null;
  stars?: number;
  featured?: boolean;
};

const CATEGORIES = ['All', 'Web App', 'AI / ML', 'Mobile / PWA', 'Education & DSA', 'CLI & Tools'];

export default function ShowcasePage() {
  const { user, profile, loading: authLoading } = useAuth();

  const [projects, setProjects] = useState<ShowcaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ShowcaseProject | null>(null);
  const [likedProjects, setLikedProjects] = useState<Record<string, boolean>>({});

  // Submission Form State
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [form, setForm] = useState({
    title: '',
    tagline: '',
    description: '',
    techStack: '',
    category: 'Web App',
    githubUrl: '',
    liveUrl: '',
    demoVideoUrl: '',
  });

  const loadProjects = async () => {
    try {
      const data = await api<{ ok: boolean; projects: ShowcaseProject[] }>('/showcase/projects');
      setProjects(data.projects || []);
    } catch {
      // Fallback
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleOpenSubmit = () => {
    if (authLoading) return;
    if (!user) {
      setIsAuthPromptOpen(true);
    } else {
      setIsSubmitModalOpen(true);
      setSubmitSuccess(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthPromptOpen(true);
      return;
    }

    if (!form.title.trim() || !form.tagline.trim() || !form.description.trim() || !form.techStack.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setFormSubmitting(true);
    try {
      await api('/showcase/submit', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      setSubmitSuccess(true);
      toast.success('Project submitted! The admin team has received your notification on email.');
      setForm({
        title: '',
        tagline: '',
        description: '',
        techStack: '',
        category: 'Web App',
        githubUrl: '',
        liveUrl: '',
        demoVideoUrl: '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit project';
      toast.error(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleLike = (id: string) => {
    setLikedProjects(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredProjects = projects.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      p.title.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.techStack.some(t => t.toLowerCase().includes(q)) ||
      p.authorName.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-24 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Background Decorative Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-500/15 via-cyan-500/10 to-transparent blur-3xl opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 space-y-12">
        
        {/* Header Hero Section */}
        <AnimatedSection className="text-center max-w-3xl mx-auto space-y-5" direction="up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold tracking-wide">
            <Sparkles className="size-3.5" /> CampusCoder Community Projects
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight font-mono">
            Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Showcase</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed">
            Discover cutting-edge apps, AI tools, DSA visualizers, and open-source packages created by verified student builders across colleges.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button 
              variant="primary" 
              onClick={handleOpenSubmit}
              className="flex items-center gap-2 text-sm font-bold shadow-lg shadow-emerald-500/20 py-2.5 px-5 cursor-pointer"
            >
              <Plus className="size-4" /> Share Your Project
            </Button>
            <a href="#browse-projects">
              <Button variant="secondary" className="flex items-center gap-2 text-sm py-2.5 px-5">
                Explore Gallery
              </Button>
            </a>
          </div>
        </AnimatedSection>

        {/* Search & Category Filter Bar */}
        <div id="browse-projects" className="space-y-4 pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by title, stack, or student..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 backdrop-blur-md transition-all placeholder:text-slate-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              <Filter className="size-3.5 text-slate-500 shrink-0 ml-1 mr-0.5 hidden sm:block" />
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 bg-slate-900/30 border border-slate-800/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredProjects.map((project, index) => {
              const isLiked = likedProjects[project.id];
              const starCount = (project.stars || 10) + (isLiked ? 1 : 0);

              return (
                <AnimatedSection key={project.id} direction="up" delay={index * 0.05}>
                  <Card className="h-full flex flex-col justify-between border-slate-800/80 bg-slate-900/40 backdrop-blur-md p-6 hover:border-emerald-500/40 hover:bg-slate-900/70 transition-all group relative overflow-hidden">
                    
                    {/* Top Accent Gradient Bar */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent group-hover:via-emerald-400 transition-all" />

                    <div className="space-y-4">
                      {/* Header Badge & Category */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="default" className="text-[10px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                          {project.category}
                        </Badge>

                        <button
                          type="button"
                          onClick={() => toggleLike(project.id)}
                          className={`flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-md transition-colors cursor-pointer ${
                            isLiked
                              ? 'text-rose-400 bg-rose-500/10'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                          }`}
                          title="Like this project"
                        >
                          <Heart className={`size-3.5 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                          <span>{starCount}</span>
                        </button>
                      </div>

                      {/* Title & Tagline */}
                      <div>
                        <h3 
                          onClick={() => setSelectedProject(project)}
                          className="text-xl font-bold text-white font-mono group-hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-2"
                        >
                          {project.title}
                          <ArrowUpRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-emerald-400 shrink-0" />
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {project.tagline}
                        </p>
                      </div>

                      {/* Tech Stack Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.techStack.map(tech => (
                          <span
                            key={tech}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Author & Links Footer */}
                    <div className="pt-5 mt-4 border-t border-slate-800/60 flex items-center justify-between gap-3 text-xs">
                      
                      {/* Author Info */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">
                          {project.authorName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-200 text-[11px] truncate flex items-center gap-1">
                            {project.authorName}
                            <span title="Verified Student Builder">
                              <ShieldCheck className="size-3 text-emerald-400 inline shrink-0" />
                            </span>
                          </p>
                          {project.authorCollege && (
                            <p className="text-[10px] text-slate-500 truncate font-mono">
                              {project.authorCollege}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="View GitHub Repository"
                          >
                            <GithubIcon className="size-3.5" />
                          </a>
                        )}
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                            title="Open Live Demo"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                </AnimatedSection>
              );
            })}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800/80 rounded-3xl p-8 sm:p-12 space-y-5 max-w-2xl mx-auto backdrop-blur-md">
            <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <Code2 className="size-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-mono">No Projects Shared Yet</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                Be the first verified student builder to share a project! Submit your work and get featured on the community showcase.
              </p>
            </div>
            <Button variant="primary" onClick={handleOpenSubmit} className="flex items-center gap-2 mx-auto cursor-pointer">
              <Plus className="size-4" /> Submit the First Project
            </Button>
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-3xl p-8 space-y-4">
            <Code2 className="size-12 text-slate-700 mx-auto" />
            <p className="text-base font-mono text-slate-300">No projects found matching your search.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Try selecting another category or resetting filters.</p>
            <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
              Reset Filters
            </Button>
          </div>
        )}

        {/* Callout Banner at bottom */}
        <AnimatedSection className="pt-8" direction="up">
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-cyan-950/40 border border-emerald-500/20 rounded-3xl p-8 md:p-12 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono text-xs font-semibold">
                <Terminal className="size-3" /> Build • Ship • Inspire
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                Built something awesome in college?
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Submit your project to get peer feedback, showcase your skills to recruiters, and inspire fellow students across universities.
              </p>
            </div>

            <Button 
              variant="primary" 
              onClick={handleOpenSubmit}
              className="flex items-center gap-2 text-base font-bold px-8 py-3.5 shadow-xl shadow-emerald-500/25 shrink-0 cursor-pointer"
            >
              <Plus className="size-5" /> Submit Project
            </Button>
          </div>
        </AnimatedSection>
      </div>

      {/* --- MODAL 1: Submit Project Modal --- */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Code2 className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-mono">Submit Project to Showcase</h2>
                  <p className="text-[11px] text-slate-400">Will be sent directly to admin for email notification &amp; review</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-8 text-center space-y-5">
                <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                  <CheckCircle2 className="size-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white font-mono">Project Submitted!</h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Thank you for sharing your work! An email notification has been dispatched to the admin team.
                  </p>
                </div>
                <div className="pt-2">
                  <Button variant="primary" onClick={() => setIsSubmitModalOpen(false)}>
                    Close &amp; Return to Gallery
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                
                {/* Verified Student Badge */}
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-slate-200 font-semibold font-mono">
                        Submitting as: {profile?.full_name || user?.email}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        {profile?.college ? `${profile.college} • ` : ''}{user?.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-[10px] text-emerald-400 font-mono">
                    Verified
                  </Badge>
                </div>

                {/* Project Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AlgoVisualizer 3D"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                {/* Tagline */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                    Short Tagline / Pitch *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Interactive 3D algorithm visualizer built with Three.js & React"
                    value={form.tagline}
                    onChange={e => setForm({ ...form, tagline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                {/* Category & Tech Stack Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                      Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      <option value="Web App">Web App</option>
                      <option value="AI / ML">AI / ML</option>
                      <option value="Mobile / PWA">Mobile / PWA</option>
                      <option value="Education & DSA">Education &amp; DSA</option>
                      <option value="CLI & Tools">CLI &amp; Tools</option>
                      <option value="Open Source">Open Source</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                      Tech Stack (Comma-separated) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Next.js, TypeScript, Tailwind, Supabase"
                      value={form.techStack}
                      onChange={e => setForm({ ...form, techStack: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Full Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                    Detailed Description / Problem Solved *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what problem this project solves, how it works, and any key architecture highlights..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Links: GitHub, Live Demo, Video */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <GithubIcon className="size-3.5 text-slate-400" /> GitHub Repo URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/username/project"
                      value={form.githubUrl}
                      onChange={e => setForm({ ...form, githubUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ExternalLink className="size-3.5 text-emerald-400" /> Live Demo URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourproject.vercel.app"
                      value={form.liveUrl}
                      onChange={e => setForm({ ...form, liveUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Video className="size-3.5 text-cyan-400" /> Demo Video URL (Loom / YouTube, optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://loom.com/share/..."
                    value={form.demoVideoUrl}
                    onChange={e => setForm({ ...form, demoVideoUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono transition-colors"
                  />
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsSubmitModalOpen(false)}
                    disabled={formSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={formSubmitting}
                    className="flex items-center gap-2 font-bold px-6 cursor-pointer"
                  >
                    {formSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Submitting&hellip;
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" /> Send Project for Review
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 2: Auth Requirement Prompt --- */}
      {isAuthPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <Card className="max-w-md w-full border-slate-800 bg-slate-900 p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="p-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                <ShieldCheck className="size-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-mono">Verified Student Access</h3>
                <p className="text-xs text-slate-400">Join the CampusCoder community to share</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Only verified student members can submit projects to the showcase. Sign in or create a free student account to share your work!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/login?redirect=/showcase" className="flex-1">
                <Button variant="primary" className="w-full justify-center">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup?redirect=/showcase" className="flex-1">
                <Button variant="secondary" className="w-full justify-center">
                  Create Account
                </Button>
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setIsAuthPromptOpen(false)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 font-mono transition-colors pt-1 cursor-pointer"
            >
              Maybe later
            </button>
          </Card>
        </div>
      )}

      {/* --- MODAL 3: Project Details Quick View --- */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Badge variant="default" className="text-[10px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                    {selectedProject.category}
                  </Badge>
                  <h2 className="text-2xl font-bold text-white font-mono mt-2">{selectedProject.title}</h2>
                  <p className="text-sm text-emerald-400 font-medium">{selectedProject.tagline}</p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Author</p>
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                    {selectedProject.authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedProject.authorName}</p>
                    {selectedProject.authorCollege && (
                      <p className="text-xs text-slate-400">{selectedProject.authorCollege}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400">About the Project</p>
                <div className="text-sm text-slate-300 leading-relaxed bg-slate-950/30 p-4 rounded-xl border border-slate-800/80 whitespace-pre-line">
                  {selectedProject.description}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Tech Stack</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.techStack.map(t => (
                    <span key={t} className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
                {selectedProject.liveUrl && (
                  <a href={selectedProject.liveUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[140px]">
                    <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                      <ExternalLink className="size-4" /> Live Demo
                    </Button>
                  </a>
                )}
                {selectedProject.githubUrl && (
                  <a href={selectedProject.githubUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[140px]">
                    <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                      <GithubIcon className="size-4" /> View GitHub
                    </Button>
                  </a>
                )}
                <Button variant="secondary" onClick={() => setSelectedProject(null)} className="shrink-0">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
