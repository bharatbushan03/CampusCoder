'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  PlusCircle, Trash2, Loader2, Edit, Search, ArrowLeft, Link2, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function AdminCommunityLinksPage() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLinks = async () => {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from('community_links')
        .select('*')
        .order('platform', { ascending: true });

      if (error) throw error;
      setLinks(data || []);
    } catch (err: any) {
      console.warn('Error loading links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this community link?')) return;
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('community_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadLinks();
    } catch (err: any) {
      alert('Failed to delete link: ' + err.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('community_links')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await loadLinks();
    } catch (err: any) {
      alert('Failed to update link status: ' + err.message);
    }
  };

  const filteredLinks = links.filter((link) => {
    return link.platform?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           link.url?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[calc(100vh-10rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-400">Loading community links...</p>
        </div>
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">Community Links</h1>
          <p className="text-sm text-slate-400">Manage social media and community platform endpoints.</p>
        </div>
        <div>
          <Link href="/admin/community-links/new">
            <Button variant="primary" className="flex items-center gap-1.5 w-full sm:w-auto">
              <PlusCircle className="h-4 w-4" /> Add New Link
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by platform or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      {filteredLinks.length > 0 ? (
        <Card hoverEffect={false} className="border-slate-900 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/60 font-mono text-xs text-slate-500">
                  <th className="py-4 px-6 font-semibold">Platform</th>
                  <th className="py-4 px-6 font-semibold">URL</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-sm text-slate-300">
                {filteredLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white capitalize">
                      {link.platform}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-xs font-mono text-xs text-slate-400">{link.url}</span>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-emerald-400">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => handleToggleActive(link.id, link.is_active)}
                        className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[10px] font-mono font-medium border capitalize cursor-pointer ${
                          link.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {link.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/community-links/${link.id}/edit`}>
                          <button className="text-[10px] font-mono px-2 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 rounded flex items-center gap-1 cursor-pointer">
                            <Edit className="h-3 w-3" /> Edit
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
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
        <div className="text-center py-12 bg-slate-900/10 border border-slate-900 rounded-xl">
          <p className="text-sm font-mono text-slate-500">No community links found.</p>
        </div>
      )}
    </div>
  );
}
