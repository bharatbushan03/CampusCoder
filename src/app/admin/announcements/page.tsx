'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  PlusCircle, Trash2, Loader2, Edit, Search, ArrowLeft, Bell, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function AdminAnnouncementsPage() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAnnouncements = async () => {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          events (title)
        `)
        .order('publish_date', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err: any) {
      console.warn('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadAnnouncements();
    } catch (err: any) {
      alert('Failed to delete announcement: ' + err.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await loadAnnouncements();
    } catch (err: any) {
      alert('Failed to update announcement status: ' + err.message);
    }
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    return ann.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           ann.message?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[calc(100vh-10rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-400">Loading announcements...</p>
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">Announcements</h1>
          <p className="text-sm text-slate-400">Broadcast updates and news to the community.</p>
        </div>
        <div>
          <Link href="/admin/announcements/new">
            <Button variant="primary" className="flex items-center gap-1.5 w-full sm:w-auto">
              <PlusCircle className="h-4 w-4" /> New Announcement
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      {filteredAnnouncements.length > 0 ? (
        <Card hoverEffect={false} className="border-slate-900 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/60 font-mono text-xs text-slate-500">
                  <th className="py-4 px-6 font-semibold">Title & Event</th>
                  <th className="py-4 px-6 font-semibold">Publish Date</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-sm text-slate-300">
                {filteredAnnouncements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{ann.title}</div>
                      {ann.events?.title && (
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" /> {ann.events.title}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      {new Date(ann.publish_date).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => handleToggleActive(ann.id, ann.is_active)}
                        className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[10px] font-mono font-medium border capitalize cursor-pointer ${
                          ann.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {ann.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/announcements/${ann.id}/edit`}>
                          <button className="text-[10px] font-mono px-2 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 rounded flex items-center gap-1 cursor-pointer">
                            <Edit className="h-3 w-3" /> Edit
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
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
          <p className="text-sm font-mono text-slate-500">No announcements found.</p>
        </div>
      )}
    </div>
  );
}
