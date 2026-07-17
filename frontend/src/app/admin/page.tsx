'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  Users,
  PlusCircle,
  UserCheck,
  Loader2,
  AlertTriangle,
  Layers,
  Trophy,
  Megaphone,
  Link2,
  X,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getErrorMessage } from '@/lib/errors';
import type { Database } from '@/types/database.types';
import { Badge } from '@/components/ui/Badge';

type EventRow = Database['public']['Tables']['events']['Row'];
type RegistrationRow = Database['public']['Tables']['registrations']['Row'];
type AnnouncementRow = Database['public']['Tables']['announcements']['Row'];
type CommunityLinkRow = Database['public']['Tables']['community_links']['Row'];
type StudentProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'id'>;
type RegistrationWithEvent = RegistrationRow & {
  events: Pick<EventRow, 'title'> | null;
};
type AnnouncementWithEvent = AnnouncementRow & {
  events: Pick<EventRow, 'title'> | null;
};
type EventType = EventRow['event_type'];
type EventMode = EventRow['mode'];
type EventStatus = EventRow['status'];
type EventFormState = {
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  event_type: EventType;
  mode: EventMode;
  date: string;
  start_time: string;
  end_time: string;
  meeting_link: string;
  registration_deadline: string;
  banner_url: string;
  status: EventStatus;
};

const initialEventForm: EventFormState = {
  title: '',
  slug: '',
  short_description: '',
  full_description: '',
  event_type: 'workshop',
  mode: 'online',
  date: '',
  start_time: '',
  end_time: '',
  meeting_link: '',
  registration_deadline: '',
  banner_url: '',
  status: 'published',
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
    activeStudents: 0,
    completedEvents: 0,
  });

  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementWithEvent[]>([]);
  const [communityLinks, setCommunityLinks] = useState<CommunityLinkRow[]>([]);
  const [isDbOffline, setIsDbOffline] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [showEventModal, setShowEventModal] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const [eventForm, setEventForm] = useState<EventFormState>(initialEventForm);

  const [announceForm, setAnnounceForm] = useState({
    title: '',
    message: '',
    event_id: '',
    publish_date: '',
    is_active: true,
  });

  const [linkForm, setLinkForm] = useState({
    platform: 'Discord',
    url: '',
    is_active: true,
  });

  const [customPlatform, setCustomPlatform] = useState('');
  const [editingAnnounceId, setEditingAnnounceId] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isSubmittingAnnounce, setIsSubmittingAnnounce] = useState(false);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);

  const loadDashboardData = async () => {
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      const todayStr = new Date().toISOString().split('T')[0];

      const [eventsRes, regsRes, membersRes, announcementsRes, linksRes] = await Promise.all([
        supabase.from('events').select('*').order('date', { ascending: false }).returns<EventRow[]>(),
        supabase.from('registrations').select('*, events(title)').order('registered_at', { ascending: false }).returns<RegistrationWithEvent[]>(),
        supabase.from('profiles').select('id').eq('role', 'student').returns<StudentProfile[]>(),
        supabase.from('announcements').select('*, events(title)').order('created_at', { ascending: false }).returns<AnnouncementWithEvent[]>(),
        supabase.from('community_links').select('*').returns<CommunityLinkRow[]>(),
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (regsRes.error) throw regsRes.error;

      const eventsList = eventsRes.data || [];
      const regsList = regsRes.data || [];
      const membersList = membersRes.data || [];
      const announceList = announcementsRes.data || [];
      const linksList = linksRes.data || [];

      setEvents(eventsList);
      setRegistrations(regsList);
      setAnnouncements(announceList);
      setCommunityLinks(linksList);

      const totalEvents = eventsList.length;
      const upcomingEvents = eventsList.filter((event) => event.status === 'published' && event.date >= todayStr).length;
      const completedEvents = eventsList.filter((event) => event.status === 'completed').length;
      const totalRegistrations = regsList.length;
      const activeStudents = membersList.length;

      setStats({ totalEvents, upcomingEvents, totalRegistrations, activeStudents, completedEvents });
      setIsDbOffline(false);
    } catch (err) {
      console.warn('Supabase queries failed, loading mock data:', err);
      setIsDbOffline(true);

      const now = new Date().toISOString();
      const mockEvents: EventRow[] = [
        { id: '1', title: 'Hands-on React & Next.js Workshop', slug: 'react-nextjs-workshop', short_description: null, full_description: null, event_type: 'workshop', mode: 'online', date: '2026-06-05', start_time: '14:00', end_time: '16:00', meeting_link: 'https://meet.google.com/abc', registration_deadline: null, banner_url: null, status: 'published', created_by: null, created_at: now, updated_at: now, meeting_link_sent_at: null, summary: null, recording_url: null },
        { id: '2', title: 'Cracking the Coding Interview: AMA', slug: 'cracking-coding-interview-ama', short_description: null, full_description: null, event_type: 'webinar' as const, mode: 'online' as const, date: '2026-06-12', start_time: '18:00', end_time: '19:30', meeting_link: 'https://meet.google.com/def', registration_deadline: null, banner_url: null, status: 'published' as const, created_by: null, created_at: '', updated_at: '', meeting_link_sent_at: null, summary: null, recording_url: null },
        { id: '3', title: 'Weekly Coding Sprint', slug: 'weekly-coding-sprint', short_description: null, full_description: null, event_type: 'coding_session' as const, mode: 'online' as const, date: '2026-05-20', start_time: '17:00', end_time: '19:00', meeting_link: null, registration_deadline: null, banner_url: null, status: 'completed' as const, created_by: null, created_at: '', updated_at: '', meeting_link_sent_at: null, summary: null, recording_url: null },
      ];
      setEvents(mockEvents);

      const mockRegs: RegistrationWithEvent[] = [
        { id: 'reg-1', full_name: 'Bharat Lashotra', email: '2024a6r009@mietjammu.in', phone: '6006788434', college: null, branch: null, year: null, coding_level: null, preferred_language: null, reason_to_join: null, registered_at: '2026-05-28T10:00:00Z', attendance_status: 'registered', event_id: '1', events: { title: 'Hands-on React & Next.js Workshop' } },
        { id: 'reg-2', full_name: 'Priya Iyer', email: 'priya.iyer@college.edu', phone: null, college: null, branch: null, year: null, coding_level: null, preferred_language: null, reason_to_join: null, registered_at: '2026-05-28T08:30:00Z', attendance_status: 'registered' as const, event_id: '2', events: { title: 'Cracking the Coding Interview: AMA' } },
        { id: 'reg-3', full_name: 'Kabir Verma', email: 'kabir.v@college.edu', phone: null, college: null, branch: null, year: null, coding_level: null, preferred_language: null, reason_to_join: null, registered_at: '2026-05-27T14:15:00Z', attendance_status: 'registered', event_id: '3', events: { title: 'Weekly Coding Sprint' } },
      ];
      setRegistrations(mockRegs);

      const mockAnnouncements: AnnouncementWithEvent[] = [
        { id: 'ann-1', title: 'Discord Server Active', message: 'Join our official Discord server for notifications.', event_id: null, is_active: true, publish_date: '2026-05-25T08:00:00Z', created_by: null, created_at: '2026-05-25T08:00:00Z', events: null },
      ];
      setAnnouncements(mockAnnouncements);

      const mockLinks = [
        { id: 'link-1', platform: 'Discord', url: 'https://discord.gg/VdsX64E5E', is_active: true },
        { id: 'link-2', platform: 'WhatsApp', url: 'https://chat.whatsapp.com/KLOHfAjbu91IP5C9SqPnP2', is_active: true },
      ];
      setCommunityLinks(mockLinks);

      setStats({ totalEvents: mockEvents.length, upcomingEvents: 2, totalRegistrations: mockRegs.length, activeStudents: 0, completedEvents: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const handleEventTitleChange = (value: string) => {
    const generatedSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setEventForm((prev) => ({ ...prev, title: value, slug: generatedSlug }));
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.slug || !eventForm.date || !eventForm.start_time || !eventForm.end_time) {
      alert('Please fill out all required event fields.');
      return;
    }
    setIsSubmittingEvent(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('events').insert({
        title: eventForm.title,
        slug: eventForm.slug,
        short_description: eventForm.short_description || null,
        full_description: eventForm.full_description || null,
        event_type: eventForm.event_type,
        mode: eventForm.mode,
        date: eventForm.date,
        start_time: eventForm.start_time,
        end_time: eventForm.end_time,
        meeting_link: eventForm.meeting_link || null,
        registration_deadline: eventForm.registration_deadline ? new Date(eventForm.registration_deadline).toISOString() : null,
        banner_url: eventForm.banner_url || null,
        status: eventForm.status,
        created_by: currentUserId,
      });
      if (error) throw error;
      setShowEventModal(false);
      setEventForm(initialEventForm);
      await loadDashboardData();
    } catch (err) {
      alert('Failed to save event: ' + getErrorMessage(err));
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!announceForm.title || !announceForm.message) {
      alert('Please enter title and message.');
      return;
    }
    setIsSubmittingAnnounce(true);
    try {
      const supabase = createClient();
      const announcementData = {
        title: announceForm.title,
        message: announceForm.message,
        event_id: announceForm.event_id || null,
        publish_date: announceForm.publish_date ? new Date(announceForm.publish_date).toISOString() : new Date().toISOString(),
        is_active: announceForm.is_active,
        created_by: currentUserId,
      };
      if (editingAnnounceId) {
        const { error } = await supabase.from('announcements').update(announcementData).eq('id', editingAnnounceId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('announcements').insert(announcementData);
        if (error) throw error;
      }
      setShowAnnounceModal(false);
      setAnnounceForm({ title: '', message: '', event_id: '', publish_date: '', is_active: true });
      setEditingAnnounceId(null);
      await loadDashboardData();
    } catch (err) {
      alert('Failed to save announcement: ' + getErrorMessage(err));
    } finally {
      setIsSubmittingAnnounce(false);
    }
  };

  const handleSaveLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const finalPlatform = linkForm.platform === 'Custom' ? customPlatform : linkForm.platform;
    if (!finalPlatform || !linkForm.url) {
      alert('Please enter platform and URL.');
      return;
    }
    setIsSubmittingLink(true);
    try {
      const supabase = createClient();
      const linkData = { platform: finalPlatform, url: linkForm.url, is_active: linkForm.is_active };
      if (editingLinkId) {
        const { error } = await supabase.from('community_links').update(linkData).eq('id', editingLinkId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('community_links').insert(linkData);
        if (error) throw error;
      }
      setShowLinkModal(false);
      setLinkForm({ platform: 'Discord', url: '', is_active: true });
      setCustomPlatform('');
      setEditingLinkId(null);
      await loadDashboardData();
    } catch (err) {
      alert('Failed to save community link: ' + getErrorMessage(err));
    } finally {
      setIsSubmittingLink(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="flex flex-col items-center gap-3">
          <div className="size-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 font-mono">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of events, registrations, and community activity.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => setShowEventModal(true)}>
            <PlusCircle className="size-4 mr-1.5" /> Create Event
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setShowAnnounceModal(true); setEditingAnnounceId(null); }}>
            <Megaphone className="size-4 mr-1.5" /> Announcement
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowLinkModal(true); setEditingLinkId(null); }}>
            <Link2 className="size-4 mr-1.5" /> Add Link
          </Button>
        </div>
      </div>

      {isDbOffline && (
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-amber-500/10 rounded-xl text-xs text-slate-400">
          <AlertTriangle className="size-4 text-amber-500 shrink-0" />
          <span>Local Demo Mode: Running on simulated database metrics. DB modifications will bypass network commits.</span>
        </div>
      )}

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Total events" value={stats.totalEvents} icon={Layers} color="slate" />
        <MetricCard label="Upcoming" value={stats.upcomingEvents} icon={Calendar} color="emerald" />
        <MetricCard label="Completed" value={stats.completedEvents} icon={Trophy} color="amber" />
        <MetricCard label="Registrations" value={stats.totalRegistrations} icon={Users} color="cyan" />
        <MetricCard label="Students" value={stats.activeStudents} icon={UserCheck} color="purple" />
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent Registrations */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader
            title="Recent registrations"
            icon={Users}
            href="/admin/registrations"
            linkLabel="View all"
          />

          {registrations.length > 0 ? (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-xs text-slate-500">
                      <th className="py-3 px-5 font-medium">Student</th>
                      <th className="py-3 px-5 font-medium">Event</th>
                      <th className="py-3 px-5 font-medium">Date</th>
                      <th className="py-3 px-5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                    {registrations.slice(0, 5).map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-3 px-5">
                          <div className="font-medium text-slate-200">{reg.full_name}</div>
                          <div className="text-xs text-slate-600">{reg.email}</div>
                        </td>
                        <td className="py-3 px-5 text-slate-400 text-xs">{reg.events?.title || '—'}</td>
                        <td className="py-3 px-5 text-xs text-slate-500">
                          {new Date(reg.registered_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-5">
                          <Badge variant={reg.attendance_status === 'attended' ? 'success' : reg.attendance_status === 'absent' ? 'warning' : 'default'}>
                            {reg.attendance_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <EmptyCard message="No registrations yet." />
          )}
        </div>

        {/* Right: Announcements + Community Links */}
        <div className="space-y-8">
          {/* Announcements */}
          <div className="space-y-4">
            <SectionHeader title="Announcements" icon={Megaphone} href="/admin/announcements" linkLabel="Manage" />
            <div className="space-y-3">
              {announcements.filter(a => a.is_active).slice(0, 3).length > 0 ? (
                announcements.filter(a => a.is_active).slice(0, 3).map((ann) => (
                  <Card key={ann.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium text-slate-200">{ann.title}</h3>
                      <Badge variant={ann.is_active ? 'accent' : 'default'}>
                        {ann.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ann.message}</p>
                    <p className="text-[10px] text-slate-600">
                      {new Date(ann.publish_date).toLocaleDateString()}
                    </p>
                  </Card>
                ))
              ) : (
                <EmptyCard message="No active announcements." />
              )}
            </div>
          </div>

          {/* Community Links */}
          <div className="space-y-4">
            <SectionHeader title="Community links" icon={Link2} href="/admin/community-links" linkLabel="Manage" />
            <div className="space-y-2">
              {communityLinks.length > 0 ? (
                communityLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-900/40 border border-slate-800/60 hover:border-slate-700 transition-colors">
                    <span className="text-sm font-medium text-slate-300">{link.platform}</span>
                    <div className="flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${link.is_active ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-emerald-400">
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyCard message="No community links configured." />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {/* Create Event Modal */}
      {showEventModal && (
        <Modal title="Create Event" icon={Plus} onClose={() => setShowEventModal(false)}>
          <form onSubmit={handleCreateEvent} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modal-event-title">Event Title *</Label>
                <input id="modal-event-title" type="text" required placeholder="e.g. Next.js Web Dev Camp"
                  value={eventForm.title} onChange={(e) => handleEventTitleChange(e.target.value)}
                  className="input-field" />
              </div>
              <div>
                <Label htmlFor="modal-event-slug">URL Slug *</Label>
                <input id="modal-event-slug" type="text" required placeholder="nextjs-web-dev-camp"
                  value={eventForm.slug} onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })}
                  className="input-field font-mono text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="modal-event-type">Event Type</Label>
                <select id="modal-event-type" value={eventForm.event_type} onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value as EventType })} className="input-field">
                  <option value="workshop">Workshop</option>
                  <option value="coding_session">Coding Session</option>
                  <option value="orientation">Orientation</option>
                  <option value="challenge">Challenge</option>
                  <option value="webinar">Webinar</option>
                </select>
              </div>
              <div>
                <Label htmlFor="modal-event-mode">Mode</Label>
                <select id="modal-event-mode" value={eventForm.mode} onChange={(e) => setEventForm({ ...eventForm, mode: e.target.value as EventMode })} className="input-field">
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <Label htmlFor="modal-event-status">Status</Label>
                <select id="modal-event-status" value={eventForm.status} onChange={(e) => setEventForm({ ...eventForm, status: e.target.value as EventStatus })} className="input-field">
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="modal-event-date">Date *</Label>
                <input id="modal-event-date" type="date" required value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="input-field" />
              </div>
              <div>
                <Label htmlFor="modal-event-start">Start Time *</Label>
                <input id="modal-event-start" type="time" required value={eventForm.start_time} onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })} className="input-field" />
              </div>
              <div>
                <Label htmlFor="modal-event-end">End Time *</Label>
                <input id="modal-event-end" type="time" required value={eventForm.end_time} onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modal-event-meeting">Meeting Link</Label>
                <input id="modal-event-meeting" type="url" placeholder="https://meet.google.com/..." value={eventForm.meeting_link} onChange={(e) => setEventForm({ ...eventForm, meeting_link: e.target.value })} className="input-field" />
              </div>
              <div>
                <Label htmlFor="modal-event-deadline">Registration Deadline</Label>
                <input id="modal-event-deadline" type="datetime-local" value={eventForm.registration_deadline} onChange={(e) => setEventForm({ ...eventForm, registration_deadline: e.target.value })} className="input-field" />
              </div>
            </div>
            <div>
              <Label htmlFor="modal-event-banner">Banner Image URL</Label>
              <input id="modal-event-banner" type="url" placeholder="https://images.unsplash.com/..." value={eventForm.banner_url} onChange={(e) => setEventForm({ ...eventForm, banner_url: e.target.value })} className="input-field" />
            </div>
            <div>
              <Label htmlFor="modal-event-short">Short Description</Label>
              <input id="modal-event-short" type="text" placeholder="Brief summary" value={eventForm.short_description} onChange={(e) => setEventForm({ ...eventForm, short_description: e.target.value })} className="input-field" />
            </div>
            <div>
              <Label htmlFor="modal-event-full">Full Description</Label>
              <textarea id="modal-event-full" rows={3} placeholder="Detailed description…" value={eventForm.full_description} onChange={(e) => setEventForm({ ...eventForm, full_description: e.target.value })} className="input-field" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setShowEventModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isSubmittingEvent}>
                {isSubmittingEvent ? <Loader2 className="size-4 animate-spin" /> : 'Save Event'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Announcement Modal */}
      {showAnnounceModal && (
        <Modal title={editingAnnounceId ? 'Edit Announcement' : 'New Announcement'} icon={Megaphone} onClose={() => { setShowAnnounceModal(false); setEditingAnnounceId(null); }}>
          <form onSubmit={handleSaveAnnouncement} className="space-y-5">
            <div>
              <Label htmlFor="modal-announce-title">Title *</Label>
              <input id="modal-announce-title" type="text" required placeholder="e.g. Discord Server Launch" value={announceForm.title} onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })} className="input-field" />
            </div>
            <div>
              <Label htmlFor="modal-announce-event">Target Event (Optional)</Label>
              <select id="modal-announce-event" value={announceForm.event_id} onChange={(e) => setAnnounceForm({ ...announceForm, event_id: e.target.value })} className="input-field">
                <option value="">Global (no specific event)</option>
                {events.map((e) => (<option key={e.id} value={e.id}>{e.title}</option>))}
              </select>
            </div>
            <div>
              <Label htmlFor="modal-announce-date">Publish Date *</Label>
              <input id="modal-announce-date" type="datetime-local" required value={announceForm.publish_date} onChange={(e) => setAnnounceForm({ ...announceForm, publish_date: e.target.value })} className="input-field" />
            </div>
            <div>
              <Label htmlFor="modal-announce-msg">Message *</Label>
              <textarea id="modal-announce-msg" rows={4} required placeholder="Announcement details…" value={announceForm.message} onChange={(e) => setAnnounceForm({ ...announceForm, message: e.target.value })} className="input-field" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input type="checkbox" checked={announceForm.is_active} onChange={(e) => setAnnounceForm({ ...announceForm, is_active: e.target.checked })} className="rounded border-slate-700 text-emerald-500 bg-slate-900 accent-emerald-500" />
              Make active immediately
            </label>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => { setShowAnnounceModal(false); setEditingAnnounceId(null); }}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isSubmittingAnnounce}>
                {isSubmittingAnnounce ? <Loader2 className="size-4 animate-spin" /> : editingAnnounceId ? 'Update' : 'Post'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <Modal title={editingLinkId ? 'Edit Link' : 'Add Community Link'} icon={Link2} onClose={() => { setShowLinkModal(false); setEditingLinkId(null); setCustomPlatform(''); }}>
          <form onSubmit={handleSaveLink} className="space-y-5">
            <div>
              <Label htmlFor="modal-link-platform">Platform *</Label>
              <select id="modal-link-platform" value={linkForm.platform} onChange={(e) => setLinkForm({ ...linkForm, platform: e.target.value })} className="input-field">
                <option value="Discord">Discord</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="GitHub">GitHub</option>
                <option value="HackerRank">HackerRank</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            {linkForm.platform === 'Custom' && (
              <div>
                <Label htmlFor="modal-link-custom">Custom Platform Name *</Label>
                <input id="modal-link-custom" type="text" required placeholder="e.g. Telegram" value={customPlatform} onChange={(e) => setCustomPlatform(e.target.value)} className="input-field" />
              </div>
            )}
            <div>
              <Label htmlFor="modal-link-url">URL *</Label>
              <input id="modal-link-url" type="url" required placeholder="https://..." value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} className="input-field" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input type="checkbox" checked={linkForm.is_active} onChange={(e) => setLinkForm({ ...linkForm, is_active: e.target.checked })} className="rounded border-slate-700 text-emerald-500 bg-slate-900 accent-emerald-500" />
              Make active immediately
            </label>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => { setShowLinkModal(false); setEditingLinkId(null); setCustomPlatform(''); }}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isSubmittingLink}>
                {isSubmittingLink ? <Loader2 className="size-4 animate-spin" /> : editingLinkId ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  const colorMap: Record<string, string> = {
    slate: 'text-slate-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
  };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <Icon className={`size-4 ${colorMap[color] || 'text-slate-400'}`} />
      </div>
      <p className="text-2xl font-bold text-slate-50">{value}</p>
    </Card>
  );
}

function SectionHeader({ title, icon: Icon, href, linkLabel }: { title: string; icon: React.ComponentType<{ className?: string }>; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
        <Icon className="size-4 text-emerald-400" /> {title}
      </h2>
      <Link href={href} className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
        {linkLabel} <ArrowUpRight className="size-3 inline" />
      </Link>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="text-center py-10 bg-slate-900/20 border border-slate-800/60 rounded-xl">
      <p className="text-xs text-slate-600">{message}</p>
    </div>
  );
}

function Modal({ title, icon: Icon, onClose, children }: { title: string; icon: React.ComponentType<{ className?: string }>; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 md:pt-20 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800/60 rounded-xl shadow-2xl p-6 md:p-8 my-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
          <h2 className="text-base font-semibold text-slate-50 flex items-center gap-2">
            <Icon className="size-4 text-emerald-400" /> {title}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 cursor-pointer">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-400 mb-1.5">
      {children}
    </label>
  );
}
