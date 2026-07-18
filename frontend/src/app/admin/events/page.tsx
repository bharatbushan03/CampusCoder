'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  AlertTriangle, PlusCircle, Trash2,
  Search, Filter, ArrowLeft, ArrowUpRight, Eye
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@backend/utils/supabase/client';
import { getErrorMessage } from '@backend/lib/errors';
import type { Database } from '@/types/database.types';
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';

type EventRow = Database['public']['Tables']['events']['Row'];
type EventStatus = EventRow['status'];

export default function AdminEventsListingPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [isDbOffline, setIsDbOffline] = useState(false);
  
  // Filtering & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadEvents = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false })
        .returns<EventRow[]>();

      if (error) throw error;
      setEvents(data || []);
      setIsDbOffline(false);
    } catch (err) {
      console.warn('Database offline, using mock data for events table:', err);
      setIsDbOffline(true);
      const now = new Date().toISOString();
      setEvents([
        { id: '1', title: 'Hands-on React & Next.js Workshop', slug: 'react-nextjs-workshop', short_description: null, full_description: null, event_type: 'workshop', mode: 'online', date: '2026-06-05', start_time: '14:00', end_time: '16:00', status: 'published', meeting_link: 'https://meet.google.com/abc', registration_deadline: null, banner_url: null, meeting_link_sent_at: null, summary: null, recording_url: null, created_by: null, created_at: now, updated_at: now },
        { id: '2', title: 'Cracking the Coding Interview: AMA', slug: 'cracking-coding-interview-ama', short_description: null, full_description: null, event_type: 'webinar', mode: 'online', date: '2026-06-12', start_time: '18:00', end_time: '19:30', status: 'published', meeting_link: 'https://meet.google.com/def', registration_deadline: null, banner_url: null, meeting_link_sent_at: null, summary: null, recording_url: null, created_by: null, created_at: now, updated_at: now },
        { id: '3', title: 'Weekly Coding Sprint: HackerRank practice', slug: 'weekly-coding-sprint-hackerrank', short_description: null, full_description: null, event_type: 'coding_session', mode: 'online', date: '2026-05-20', start_time: '17:00', end_time: '19:00', status: 'completed', meeting_link: null, registration_deadline: null, banner_url: null, meeting_link_sent_at: null, summary: null, recording_url: null, created_by: null, created_at: now, updated_at: now }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEvents();
  }, []);

  const handleUpdateStatus = async (eventId: string, status: EventStatus) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('events')
        .update({ status })
        .eq('id', eventId);

      if (error) throw error;
      await loadEvents();
    } catch (err) {
      alert('Failed to update event: ' + getErrorMessage(err));
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This will also remove associated speaker records and registrations.')) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      await loadEvents();
    } catch (err) {
      alert('Failed to delete event: ' + getErrorMessage(err));
    }
  };

  // Filter & Search Logic
  const filteredEvents = events.filter((ev) => {
    const matchesSearch = ev.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ev.slug?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || ev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-1">
          <Skeleton variant="text" className="h-3 w-32" />
          <Skeleton variant="text" className="h-8 w-56" />
          <Skeleton variant="text" className="h-4 w-72" />
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50">
          <SkeletonTable rows={5} cols={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
            <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Console
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">Manage Sprints</h1>
          <p className="text-sm text-slate-400">Add, edit, publish or change status of active coding sprints.</p>
        </div>
        <div>
          <Link href="/admin/events/new">
            <Button variant="primary" className="flex items-center gap-1.5 w-full sm:w-auto">
              <PlusCircle className="size-4" /> Add New Sprint
            </Button>
          </Link>
        </div>
      </div>

      {/* Database Warning Banner */}
      {isDbOffline && (
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-emerald-500/10 rounded-xl text-xs text-slate-400 font-mono">
          <AlertTriangle className="size-4 text-amber-500 flex-shrink-0" />
          <span>Local Demo Mode: Run schema setup migration to enable storage commits.</span>
        </div>
      )}

      {/* Search and Filter Panel */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input aria-label="Search events by title or slug"
            type="text"
            placeholder="Search events by title or slug&hellip;"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      {filteredEvents.length > 0 ? (
        <Card hoverEffect={false} className="border-slate-900 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/60 font-mono text-xs text-slate-500">
                  <th className="py-4 px-6 font-semibold">Sprint Title</th>
                  <th className="py-4 px-6 font-semibold">Date & Type</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-sm text-slate-300">
                {filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        {ev.title}
                        <Link href={`/events/${ev.slug}`} target="_blank" className="text-slate-500 hover:text-emerald-400" title="View Live Event Details">
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">slug: {ev.slug}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-mono text-xs text-slate-200">{ev.date} @ {ev.start_time}</div>
                      <div className="text-xs text-emerald-400 capitalize mt-0.5">{ev.event_type.replace('_', ' ')} • {ev.mode}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[10px] font-mono font-medium border capitalize ${
                        ev.status === 'published' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        ev.status === 'completed' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        ev.status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/events/${ev.id}`}>
                          <button type="button" className="text-[10px] font-mono px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded flex items-center gap-1 cursor-pointer">
                            <Eye className="size-3" /> Manage
                          </button>
                        </Link>
                        {ev.status !== 'published' && (
                          <button type="button"
                            onClick={() => handleUpdateStatus(ev.id, 'published')}
                            className="text-[10px] font-mono px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded transition-colors cursor-pointer"
                          >
                            Publish
                          </button>
                        )}
                        {ev.status === 'published' && (
                          <button type="button"
                            onClick={() => handleUpdateStatus(ev.id, 'draft')}
                            className="text-[10px] font-mono px-2 py-1 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                          >
                            Unpublish
                          </button>
                        )}
                        {ev.status === 'published' && (
                          <button type="button"
                            onClick={() => handleUpdateStatus(ev.id, 'completed')}
                            className="text-[10px] font-mono px-2 py-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded transition-colors cursor-pointer"
                          >
                            Complete
                          </button>
                        )}
                        {ev.status !== 'cancelled' && ev.status !== 'completed' && (
                          <button type="button"
                            onClick={() => handleUpdateStatus(ev.id, 'cancelled')}
                            className="text-[10px] font-mono px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        <button type="button"
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="size-4" />
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
          <p className="text-sm font-mono text-slate-500">No events found matching the search criteria.</p>
        </div>
      )}
    </div>
  );
}

