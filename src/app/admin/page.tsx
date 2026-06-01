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
  ArrowUpRight
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';
import { CampusCoderLoader } from '@/components/ui/CampusCoderLoader';

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

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  
  // Dashboard Metrics
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
    activeStudents: 0,
    completedEvents: 0
  });

  // State Lists
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementWithEvent[]>([]);
  const [communityLinks, setCommunityLinks] = useState<CommunityLinkRow[]>([]);
  const [isDbOffline, setIsDbOffline] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Modals state
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Form states
  const [eventForm, setEventForm] = useState({
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
    status: 'published'
  });

  const [announceForm, setAnnounceForm] = useState({
    title: '',
    message: '',
    event_id: '',
    publish_date: '',
    is_active: true
  });

  const [linkForm, setLinkForm] = useState({
    platform: 'Discord',
    url: '',
    is_active: true
  });

  const [customPlatform, setCustomPlatform] = useState('');
  const [editingAnnounceId, setEditingAnnounceId] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isSubmittingAnnounce, setIsSubmittingAnnounce] = useState(false);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);

  // Load all dashboard data
  const loadDashboardData = async () => {
    try {
      const supabase = createClient();
      
      // Get current user id
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      const todayStr = new Date().toISOString().split('T')[0];

      // Fetch lists in parallel
      const [eventsRes, regsRes, membersRes, announcementsRes, linksRes] = await Promise.all([
        supabase
          .from('events')
          .select('*')
          .order('date', { ascending: false })
          .returns<EventRow[]>(),
        supabase
          .from('registrations')
          .select('*, events(title)')
          .order('registered_at', { ascending: false })
          .returns<RegistrationWithEvent[]>(),
        supabase
          .from('profiles')
          .select('id')
          .eq('role', 'student')
          .returns<StudentProfile[]>(),
        supabase
          .from('announcements')
          .select('*, events(title)')
          .order('created_at', { ascending: false })
          .returns<AnnouncementWithEvent[]>(),
        supabase
          .from('community_links')
          .select('*')
          .returns<CommunityLinkRow[]>()
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

      // Compute stats
      const totalEvents = eventsList.length;
      const upcomingEvents = eventsList.filter((event) => event.status === 'published' && event.date >= todayStr).length;
      const completedEvents = eventsList.filter((event) => event.status === 'completed').length;
      const totalRegistrations = regsList.length;
      const activeStudents = membersList.length;

      setStats({
        totalEvents,
        upcomingEvents,
        totalRegistrations,
        activeStudents,
        completedEvents
      });
      setIsDbOffline(false);
    } catch (err) {
      console.warn('Supabase dashboard queries failed, loading mock fallback dashboard data:', err);
      setIsDbOffline(true);
      
      // Seed mock data
      const mockEvents = [
        { id: '1', title: 'Hands-on React & Next.js Workshop', slug: 'react-nextjs-workshop', event_type: 'workshop', mode: 'online', date: '2026-06-05', start_time: '14:00', end_time: '16:00', status: 'published' },
        { id: '2', title: 'Cracking the Coding Interview: AMA', slug: 'cracking-coding-interview-ama', event_type: 'webinar', mode: 'online', date: '2026-06-12', start_time: '18:00', end_time: '19:30', status: 'published' },
        { id: '3', title: 'Weekly Coding Sprint: HackerRank practice', slug: 'weekly-coding-sprint-hackerrank', event_type: 'coding_session', mode: 'online', date: '2026-05-20', start_time: '17:00', end_time: '19:00', status: 'completed' }
      ];
      setEvents(mockEvents);

      const mockRegs = [
        { id: 'reg-1', full_name: 'Aman Sharma', email: 'aman.sharma@college.edu', registered_at: '2026-05-28T10:00:00Z', attendance_status: 'registered', event_id: '1', events: { title: 'Hands-on React & Next.js Workshop' } },
        { id: 'reg-2', full_name: 'Priya Iyer', email: 'priya.iyer@college.edu', registered_at: '2026-05-28T08:30:00Z', attendance_status: 'registered', event_id: '2', events: { title: 'Cracking the Coding Interview: AMA' } },
        { id: 'reg-3', full_name: 'Kabir Verma', email: 'kabir.v@college.edu', registered_at: '2026-05-27T14:15:00Z', attendance_status: 'registered', event_id: '3', events: { title: 'Weekly Coding Sprint: HackerRank practice' } }
      ];
      setRegistrations(mockRegs);

      const mockAnnouncements = [
        { id: 'ann-1', title: 'Discord Server Active', message: 'Make sure to join our official Discord server for sprint notifications and resources.', created_at: '2026-05-25T08:00:00Z', events: null }
      ];
      setAnnouncements(mockAnnouncements);

      const mockLinks = [
        { id: 'link-1', platform: 'Discord', url: 'https://discord.gg/VdsX64E5E', is_active: true },
        { id: 'link-2', platform: 'WhatsApp', url: 'https://chat.whatsapp.com/KLOHfAjbu91IP5C9SqPnP2', is_active: true }
      ];
      setCommunityLinks(mockLinks);

      setStats({
        totalEvents: mockEvents.length,
        upcomingEvents: 2,
        totalRegistrations: mockRegs.length,
        activeStudents: 0,
        completedEvents: 1
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboardData();
  }, []);

  const handleEventTitleChange = (value: string) => {
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setEventForm((prev) => ({ ...prev, title: value, slug: generatedSlug }));
  };

  // Form Submissions
  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.slug || !eventForm.date || !eventForm.start_time || !eventForm.end_time) {
      alert('Please fill out all required event fields.');
      return;
    }

    setIsSubmittingEvent(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('events')
        .insert({
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
          created_by: currentUserId
        })
        .select();

      if (error) throw error;

      setShowEventModal(false);
      setEventForm({
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
        status: 'published'
      });
      await loadDashboardData();
    } catch (err) {
      alert('Failed to save event: ' + err.message);
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
        created_by: currentUserId
      };

      if (editingAnnounceId) {
        const { error } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingAnnounceId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert(announcementData);
        if (error) throw error;
      }

      setShowAnnounceModal(false);
      setAnnounceForm({
        title: '',
        message: '',
        event_id: '',
        publish_date: '',
        is_active: true
      });
      setEditingAnnounceId(null);
      await loadDashboardData();
    } catch (err) {
      alert('Failed to save announcement: ' + err.message);
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
      const linkData = {
        platform: finalPlatform,
        url: linkForm.url,
        is_active: linkForm.is_active
      };

      if (editingLinkId) {
        const { error } = await supabase
          .from('community_links')
          .update(linkData)
          .eq('id', editingLinkId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('community_links')
          .insert(linkData);
        if (error) throw error;
      }

      setShowLinkModal(false);
      setLinkForm({
        platform: 'Discord',
        url: '',
        is_active: true
      });
      setCustomPlatform('');
      setEditingLinkId(null);
      await loadDashboardData();
    } catch (err) {
      alert('Failed to save community link: ' + err.message);
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const openAnnouncementModal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - (offset * 60 * 1000));
    setAnnounceForm({
      title: '',
      message: '',
      event_id: '',
      publish_date: local.toISOString().slice(0, 16),
      is_active: true
    });
    setEditingAnnounceId(null);
    setShowAnnounceModal(true);
  };

  if (loading) {
    return <CampusCoderLoader variant="inline" label="Loading admin console" />;
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">Console</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage events, post announcements, update community channels, and track RSVPs.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="primary" 
            size="sm" 
            className="flex items-center gap-1.5"
            onClick={() => setShowEventModal(true)}
          >
            <PlusCircle className="size-4" /> Create Event
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex items-center gap-1.5"
            onClick={openAnnouncementModal}
          >
            <Megaphone className="size-4 text-emerald-400" /> Post Announcement
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1.5 border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30"
            onClick={() => {
              setLinkForm({
                platform: 'Discord',
                url: '',
                is_active: true
              });
              setCustomPlatform('');
              setEditingLinkId(null);
              setShowLinkModal(true);
            }}
          >
            <Link2 className="size-4 text-emerald-500" /> Add Link
          </Button>
        </div>
      </div>

      {/* Database warning badge */}
      {isDbOffline && (
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-emerald-500/10 rounded-xl text-xs text-slate-400 font-mono">
          <AlertTriangle className="size-4 text-amber-500 flex-shrink-0" />
          <span>Local Demo Mode: Running on simulated database metrics. DB modifications will bypass network commits.</span>
        </div>
      )}

      {/* Stats Cards Section (5 required stats) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Events */}
        <Card hoverEffect={true} className="border-slate-900 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Total Events</p>
            <Layers className="size-4 text-slate-500" />
          </div>
          <p className="text-2xl font-mono font-bold text-white mt-2">{stats.totalEvents}</p>
        </Card>

        {/* Upcoming Events */}
        <Card hoverEffect={true} className="border-slate-900 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Upcoming</p>
            <Calendar className="size-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-2">{stats.upcomingEvents}</p>
        </Card>

        {/* Completed Events */}
        <Card hoverEffect={true} className="border-slate-900 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Completed</p>
            <Trophy className="size-4 text-amber-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-amber-400 mt-2">{stats.completedEvents}</p>
        </Card>

        {/* Total Registrations */}
        <Card hoverEffect={true} className="border-slate-900 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Total RSVPs</p>
            <Users className="size-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-cyan-400 mt-2">{stats.totalRegistrations}</p>
        </Card>

        {/* Unique Students Registered */}
        <Card hoverEffect={true} className="border-slate-900 bg-slate-950/40 p-4 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Students</p>
            <UserCheck className="size-4 text-purple-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-purple-400 mt-2">{stats.activeStudents}</p>
        </Card>
      </div>

      {/* Main Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Registrations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Users className="size-5 text-emerald-400" /> Recent Registrations
            </h2>
            <Link href="/admin/registrations">
              <Button variant="outline" size="sm" className="text-[10px] font-mono py-1 px-3 h-auto">
                View All
              </Button>
            </Link>
          </div>
          
          {registrations.length > 0 ? (
            <Card hoverEffect={false} className="border-slate-900 p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/60 font-mono text-[10px] text-slate-500">
                      <th className="py-3 px-6 font-semibold">Student</th>
                      <th className="py-3 px-6 font-semibold">Event Target</th>
                      <th className="py-3 px-6 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                    {registrations.slice(0, 5).map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-3 px-6">
                          <div className="font-semibold text-white">{reg.full_name}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{reg.email}</div>
                        </td>
                        <td className="py-3 px-6 font-medium text-slate-400">
                          {reg.events?.title || 'General'}
                        </td>
                        <td className="py-3 px-6">
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-1.5 py-0.5 rounded capitalize">
                            {reg.attendance_status || 'registered'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="text-center py-10 bg-slate-900/10 border border-slate-900 rounded-xl">
              <p className="text-xs font-mono text-slate-500">No recent registrations.</p>
            </div>
          )}
        </div>

        {/* Right Column: Announcements & Links Widgets */}
        <div className="space-y-8">
          {/* Active Announcements Widget */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Megaphone className="size-4 text-emerald-400" /> Active Announcements
              </h2>
              <Link href="/admin/announcements">
                <Button variant="outline" size="sm" className="text-[10px] font-mono py-1 px-3 h-auto">
                  Manage
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {announcements.filter(a => a.is_active).slice(0, 3).length > 0 ? (
                announcements.filter(a => a.is_active).slice(0, 3).map((ann) => (
                  <Card key={ann.id} hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4 space-y-2">
                    <h3 className="text-xs font-bold text-white">{ann.title}</h3>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{ann.message}</p>
                    <div className="text-[9px] text-slate-600 font-mono">
                      {new Date(ann.publish_date).toLocaleDateString()}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg">
                  <p className="text-[10px] text-slate-500 font-mono italic">No active announcements.</p>
                </div>
              )}
            </div>
          </div>

          {/* Community Links Widget */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Link2 className="size-4 text-emerald-400" /> Community Channels
              </h2>
              <Link href="/admin/community-links">
                <Button variant="outline" size="sm" className="text-[10px] font-mono py-1 px-3 h-auto">
                  Manage
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {communityLinks.length > 0 ? (
                communityLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 group hover:border-emerald-500/20 transition-all">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{link.platform}</span>
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${link.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></span>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-emerald-400">
                        <ArrowUpRight className="size-3" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-500 font-mono italic">No links configured.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODALS SECTION */}
      {/* ------------------------------------------------------------- */}

      {/* 1. Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-6 md:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-mono">
                <Plus className="size-5 text-emerald-400" /> Create Sprint Event
              </h2>
              <button type="button" 
                onClick={() => setShowEventModal(false)}
                className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="page-event-title" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Event Title *
                  </label>
                  <input id="page-event-title"
                    type="text"
                    required
                    placeholder="e.g. Next.js Web Dev Camp"
                    value={eventForm.title}
                    onChange={(e) => handleEventTitleChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="page-url-slug" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    URL Slug *
                  </label>
                  <input id="page-url-slug"
                    type="text"
                    required
                    placeholder="nextjs-web-dev-camp"
                    value={eventForm.slug}
                    onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="page-event-type" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Event Type
                  </label>
                  <select id="page-event-type"
                    value={eventForm.event_type}
                    onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="coding_session">Coding Session</option>
                    <option value="orientation">Orientation</option>
                    <option value="challenge">Challenge</option>
                    <option value="webinar">Webinar</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="page-mode" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Mode
                  </label>
                  <select id="page-mode"
                    value={eventForm.mode}
                    onChange={(e) => setEventForm({ ...eventForm, mode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="page-publish-status" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Publish Status
                  </label>
                  <select id="page-publish-status"
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="page-date" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Date *
                  </label>
                  <input id="page-date"
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="page-start-time" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Start Time *
                  </label>
                  <input id="page-start-time"
                    type="time"
                    required
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="page-end-time" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    End Time *
                  </label>
                  <input id="page-end-time"
                    type="time"
                    required
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="page-meeting-stream-link" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Meeting Stream Link
                  </label>
                  <input id="page-meeting-stream-link"
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={eventForm.meeting_link}
                    onChange={(e) => setEventForm({ ...eventForm, meeting_link: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="page-registration-deadline" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Registration Deadline
                  </label>
                  <input id="page-registration-deadline"
                    type="datetime-local"
                    value={eventForm.registration_deadline}
                    onChange={(e) => setEventForm({ ...eventForm, registration_deadline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="page-banner-image-url" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Banner Image URL
                </label>
                <input id="page-banner-image-url"
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={eventForm.banner_url}
                  onChange={(e) => setEventForm({ ...eventForm, banner_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                />
              </div>

              <div>
                <label htmlFor="page-short-description" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Short Description
                </label>
                <input id="page-short-description"
                  type="text"
                  placeholder="Brief one-liner summary of event learning outcomes"
                  value={eventForm.short_description}
                  onChange={(e) => setEventForm({ ...eventForm, short_description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="page-full-detailed-description-supports-md-plain" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Detailed Description (Supports MD/Plain)
                </label>
                <textarea id="page-full-detailed-description-supports-md-plain"
                  rows={4}
                  placeholder="Provide details about curriculum, prerequisites, speaker bio, and schedule&hellip;"
                  value={eventForm.full_description}
                  onChange={(e) => setEventForm({ ...eventForm, full_description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowEventModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isSubmittingEvent}
                >
                  {isSubmittingEvent ? <Loader2 className="size-4 animate-spin" /> : 'Save Sprint Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Create/Edit Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                <Megaphone className="size-5 text-emerald-400" /> {editingAnnounceId ? 'Edit Announcement' : 'Post Announcement'}
              </h2>
              <button type="button" 
                onClick={() => {
                  setShowAnnounceModal(false);
                  setEditingAnnounceId(null);
                  setAnnounceForm({ title: '', message: '', event_id: '', publish_date: '', is_active: true });
                }}
                className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label htmlFor="page-announcement-title" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Announcement Title *
                </label>
                <input id="page-announcement-title"
                  type="text"
                  required
                  placeholder="e.g. Discord Server Launch"
                  value={announceForm.title}
                  onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="page-target-event-optional" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Event (Optional)
                </label>
                <select id="page-target-event-optional"
                  value={announceForm.event_id}
                  onChange={(e) => setAnnounceForm({ ...announceForm, event_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                >
                  <option value="">Global Announcement (No Specific Event)</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="page-publish-date" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Publish Date *
                  </label>
                  <input id="page-publish-date"
                    type="datetime-local"
                    required
                    value={announceForm.publish_date}
                    onChange={(e) => setAnnounceForm({ ...announceForm, publish_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="page-message-content" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Message Content *
                </label>
                <textarea id="page-message-content"
                  rows={4}
                  required
                  placeholder="Enter announcement details&hellip;"
                  value={announceForm.message}
                  onChange={(e) => setAnnounceForm({ ...announceForm, message: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="announce_active"
                  checked={announceForm.is_active}
                  onChange={(e) => setAnnounceForm({ ...announceForm, is_active: e.target.checked })}
                  className="rounded border-slate-800 text-emerald-500 bg-slate-900 focus:ring-0"
                />
                <label htmlFor="announce_active" className="text-xs text-slate-400 font-mono">
                  Make announcement active immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => {
                    setShowAnnounceModal(false);
                    setEditingAnnounceId(null);
                    setAnnounceForm({ title: '', message: '', event_id: '', publish_date: '', is_active: true });
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isSubmittingAnnounce}
                >
                  {isSubmittingAnnounce ? <Loader2 className="size-4 animate-spin" /> : (editingAnnounceId ? 'Update Announcement' : 'Post to Feed')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add/Edit Community Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                <Link2 className="size-5 text-emerald-400" /> {editingLinkId ? 'Edit Community Link' : 'Add Community Link'}
              </h2>
              <button type="button" 
                onClick={() => {
                  setShowLinkModal(false);
                  setEditingLinkId(null);
                  setLinkForm({ platform: 'Discord', url: '', is_active: true });
                  setCustomPlatform('');
                }}
                className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-4">
              <div>
                <label htmlFor="page-platform-name" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Platform Name *
                </label>
                <select id="page-platform-name"
                  value={linkForm.platform}
                  onChange={(e) => setLinkForm({ ...linkForm, platform: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                >
                  <option value="Discord">Discord</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="GitHub">GitHub</option>
                  <option value="HackerRank">HackerRank</option>
                  <option value="Custom">Custom Platform</option>
                </select>
              </div>

              {linkForm.platform === 'Custom' && (
                <div>
                  <label htmlFor="page-platform-custom-name" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Platform Custom Name *
                  </label>
                  <input id="page-platform-custom-name"
                    type="text"
                    required
                    placeholder="e.g. Telegram, Slack"
                    value={customPlatform}
                    onChange={(e) => setCustomPlatform(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              )}

              <div>
                <label htmlFor="page-platform-url" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Platform URL *
                </label>
                <input id="page-platform-url"
                  type="url"
                  required
                  placeholder="https://..."
                  value={linkForm.url}
                  onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="link_active"
                  checked={linkForm.is_active}
                  onChange={(e) => setLinkForm({ ...linkForm, is_active: e.target.checked })}
                  className="rounded border-slate-800 text-emerald-500 bg-slate-900 focus:ring-0"
                />
                <label htmlFor="link_active" className="text-xs text-slate-400 font-mono">
                  Make link active immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => {
                    setShowLinkModal(false);
                    setEditingLinkId(null);
                    setLinkForm({ platform: 'Discord', url: '', is_active: true });
                    setCustomPlatform('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isSubmittingLink}
                >
                  {isSubmittingLink ? <Loader2 className="size-4 animate-spin" /> : (editingLinkId ? 'Update Link' : 'Save Link')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
