'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  PlusCircle, Trash2, Loader2, Edit, Search, 
  ArrowLeft, BookOpen, ExternalLink, Globe, 
  Power, Filter, Info
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function AdminResourcesPage() {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadData = async () => {
    try {
      const supabase = createClient() as any;
      
      const [resRes, eventsRes] = await Promise.all([
        supabase.from('resources').select(`*, events(title)`).order('created_at', { ascending: false }),
        supabase.from('events').select('id, title').order('date', { ascending: false })
      ]);

      if (resRes.error) throw resRes.error;
      setResources(resRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (err: any) {
      console.warn('Error loading admin resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource forever?')) return;
    try {
      const supabase = createClient() as any;
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const supabase = createClient() as any;
      await supabase.from('resources').update({ is_active: !current }).eq('id', id);
      await loadData();
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  const filteredResources = resources.filter((res) => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter ? res.category === categoryFilter : true;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-screen">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Console
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">Resource <span className="text-emerald-500">Library</span></h1>
          <p className="text-sm text-slate-400">Curate roadmaps, tools, and learning materials for the community.</p>
        </div>
        <Link href="/admin/resources/new">
          <Button variant="primary" className="flex items-center gap-1.5 w-full sm:w-auto font-bold">
            <PlusCircle className="h-4 w-4" /> Add Resource
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
        >
          <option value="">All Categories</option>
          <option value="roadmaps">Roadmaps</option>
          <option value="practice">Practice</option>
          <option value="dsa">DSA Kits</option>
          <option value="placement">Placements</option>
          <option value="general">General</option>
        </select>
      </div>

      {filteredResources.length > 0 ? (
        <Card hoverEffect={false} className="border-slate-900 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/60 font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                  <th className="py-4 px-6 font-semibold">Resource Info</th>
                  <th className="py-4 px-6 font-semibold">Category</th>
                  <th className="py-4 px-6 font-semibold">Related Event</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-sm text-slate-300">
                {filteredResources.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{res.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px] mt-0.5">{res.link}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 uppercase text-slate-400">
                        {res.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {res.events?.title || <span className="text-slate-600 italic">None</span>}
                    </td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => handleToggleActive(res.id, res.is_active)}
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-mono font-medium border uppercase cursor-pointer ${
                          res.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <Power className="h-2.5 w-2.5" />
                        {res.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/resources/${res.id}/edit`}>
                          <button className="text-[10px] font-mono px-2 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 rounded flex items-center gap-1 cursor-pointer">
                            <Edit className="h-3 w-3" /> Edit
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(res.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-900 rounded-2xl">
          <BookOpen className="h-10 w-10 text-slate-800 mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-500">No resources found in the database.</p>
        </div>
      )}
    </div>
  );
}
