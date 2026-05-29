'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Calendar, Users, Eye, PlusCircle, CheckCircle2, UserCheck, Mail, 
  Loader2, AlertTriangle, Layers, Trophy, Megaphone, 
  Link2, Trash2, X, Search, Filter, Plus, Power, Edit
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard Metrics
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
    activeStudents: 0,
    completedEvents: 0
  });

  // State Lists
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [communityLinks, setCommunityLinks] = useState<any[]>([]);
  const [isDbOffline, setIsDbOffline] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'registrations' | 'events' | 'announcements' | 'links'>('registrations');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('');

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
      const supabase = createClient() as any;
      
      // Get current user id
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      const todayStr = new Date().toISOString().split('T')[0];

      // Fetch lists in parallel
      const [eventsRes, regsRes, membersRes, announcementsRes, linksRes] = await Promise.all([
        supabase.from('events').select('*').order('date', { ascending: false }),
        supabase.from('registrations').select('*, events(title)').order('registered_at', { ascending: false }),
        supabase.from('profiles').select('id').eq('role', 'student'),
        supabase.from('announcements').select('*, events(title)').order('created_at', { ascending: false }),
        supabase.from('community_links').select('*')
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
      const upcomingEvents = eventsList.filter((e: any) => e.status === 'published' && e.date >= todayStr).length;
      const completedEvents = eventsList.filter((e: any) => e.status === 'completed').length;
      const totalRegistrations = regsList.length;
      const activeStudents = membersList.length || 150; // Fallback to 150 if no student accounts registered yet

      setStats({
        totalEvents,
        upcomingEvents,
        totalRegistrations,
        activeStudents,
        completedEvents
      });
      setIsDbOffline(false);
    } catch (err: any) {
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
        { id: 'link-1', platform: 'Discord', url: 'https://discord.gg/campuscoder', is_active: true },
        { id: 'link-2', platform: 'WhatsApp', url: 'https://chat.whatsapp.com/campuscoder', is_active: true }
      ];
      setCommunityLinks(mockLinks);

      setStats({
        totalEvents: mockEvents.length,
        upcomingEvents: 2,
        totalRegistrations: mockRegs.length,
        activeStudents: 152,
        completedEvents: 1
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-fill slug from title in event form
  useEffect(() => {
    if (eventForm.title) {
      const generatedSlug = eventForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setEventForm(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [eventForm.title]);

  // Form Submissions
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.slug || !eventForm.date || !eventForm.start_time || !eventForm.end_time) {
      alert('Please fill out all required event fields.');
      return;
    }

    setIsSubmittingEvent(true);
    try {
      const supabase = createClient() as any;
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
    } catch (err: any) {
      alert('Failed to save event: ' + err.message);
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceForm.title || !announceForm.message) {
      alert('Please enter title and message.');
      return;
    }

    setIsSubmittingAnnounce(true);
    try {
      const supabase = createClient() as any;
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
    } catch (err: any) {
      alert('Failed to save announcement: ' + err.message);
    } finally {
      setIsSubmittingAnnounce(false);
    }
  };

  const handleEditAnnouncementClick = (announce: any) => {
    setEditingAnnounceId(announce.id);
    let localDateStr = '';
    if (announce.publish_date) {
      const d = new Date(announce.publish_date);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - (offset * 60 * 1000));
      localDateStr = local.toISOString().slice(0, 16);
    } else {
      const d = new Date(announce.created_at);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - (offset * 60 * 1000));
      localDateStr = local.toISOString().slice(0, 16);
    }
    setAnnounceForm({
      title: announce.title,
      message: announce.message,
      event_id: announce.event_id || '',
      publish_date: localDateStr,
      is_active: announce.is_active !== undefined ? announce.is_active : true
    });
    setShowAnnounceModal(true);
  };

  const handleToggleAnnouncementActive = async (announceId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', announceId);

      if (error) throw error;
      await loadDashboardData();
    } catch (err: any) {
      alert('Failed to update announcement status: ' + err.message);
    }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPlatform = linkForm.platform === 'Custom' ? customPlatform : linkForm.platform;
    if (!finalPlatform || !linkForm.url) {
      alert('Please enter platform and URL.');
      return;
    }

    setIsSubmittingLink(true);
    try {
      const supabase = createClient() as any;
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
    } catch (err: any) {
      alert('Failed to save community link: ' + err.message);
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const handleEditLinkClick = (link: any) => {
    setEditingLinkId(link.id);
    const standardPlatforms = ['Discord', 'WhatsApp', 'LinkedIn', 'GitHub', 'HackerRank'];
    const isStandard = standardPlatforms.includes(link.platform);
    setLinkForm({
      platform: isStandard ? link.platform : 'Custom',
      url: link.url,
      is_active: link.is_active
    });
    if (!isStandard) {
      setCustomPlatform(link.platform);
    } else {
      setCustomPlatform('');
    }
    setShowLinkModal(true);
  };

  // State manipulation triggers (Publish, cancel, complete)
  const handleUpdateEventStatus = async (eventId: string, status: 'published' | 'completed' | 'cancelled' | 'draft') => {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('events')
        .update({ status })
        .eq('id', eventId);

      if (error) throw error;
      await loadDashboardData();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This will also remove associated registrations.')) return;
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      await loadDashboardData();
    } catch (err: any) {
      alert('Failed to delete event: ' + err.message);
    }
  };

  const handleDeleteAnnouncement = async (announceId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announceId);

      if (error) throw error;
      await loadDashboardData();
    } catch (err: any) {
      alert('Failed to delete announcement: ' + err.message);
    }
  };

  const handleToggleLinkActive = async (linkId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('community_links')
        .update({ is_active: !currentStatus })
        .eq('id', linkId);

      if (error) throw error;
      await loadDashboardData();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Delete this community link?')) return;
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('community_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      await loadDashboardData();
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  };

  // Filter and Search logic for registrations list
  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch = 
      reg.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEvent = eventFilter === '' || reg.event_id === eventFilter;

    return matchesSearch && matchesEvent;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[calc(100vh-10rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-400">Loading admin operations panel...</p>
        </div>
      </div>
    );
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
            <PlusCircle className="h-4 w-4" /> Create Event
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex items-center gap-1.5"
            onClick={() => {
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
            }}
          >
            <Megaphone className="h-4 w-4 text-emerald-400" /> Post Announcement
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
            <Link2 className="h-4 w-4 text-emerald-500" /> Add Link
          </Button>
        </div>
      </div>

      {/* Database warning badge */}
      {isDbOffline && (
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-emerald-500/10 rounded-xl text-xs text-slate-400 font-mono">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>Local Demo Mode: Running on simulated database metrics. DB modifications will bypass network commits.</span>
        </div>
      )}

      {/* Stats Cards Section (5 required stats) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Events */}
        <Card hoverEffect={true} className="border-slate-900 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Total Events</p>
            <Layers className="h-4 w-4 text-slate-500" />
          </div>
          <p className="text-2xl font-mono font-bold text-white mt-2">{stats.totalEvents}</p>
        </Card>

        {/* Upcoming Events */}
        <Card hoverEffect={true} className="border-slate-900 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Upcoming</p>
            <Calendar className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-2">{stats.upcomingEvents}</p>
        </Card>

        {/* Completed Events */}
        <Card hoverEffect={true} className="border-slate-900 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Completed</p>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-amber-400 mt-2">{stats.completedEvents}</p>
        </Card>

        {/* Total Registrations */}
        <Card hoverEffect={true} className="border-slate-900 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Total RSVPs</p>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-cyan-400 mt-2">{stats.totalRegistrations}</p>
        </Card>

        {/* Unique Students Registered */}
        <Card hoverEffect={true} className="border-slate-900 bg-slate-950/40 p-4 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Students</p>
            <UserCheck className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-purple-400 mt-2">{stats.activeStudents}</p>
        </Card>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-6">
        <div className="flex border-b border-slate-900 overflow-x-auto pb-px gap-6">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`pb-3 text-sm font-semibold font-mono tracking-tight transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'registrations' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Registrations Log
            {activeTab === 'registrations' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`pb-3 text-sm font-semibold font-mono tracking-tight transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'events' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sprints Manager ({events.length})
            {activeTab === 'events' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`pb-3 text-sm font-semibold font-mono tracking-tight transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'announcements' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Announcements ({announcements.length})
            {activeTab === 'announcements' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`pb-3 text-sm font-semibold font-mono tracking-tight transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === 'links' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Community Links
            {activeTab === 'links' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            )}
          </button>
        </div>

        {/* Tab contents */}

        {/* A. Registrations Log */}
        {activeTab === 'registrations' && (
          <div className="space-y-4">
            {/* Search/Filters bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by student name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div className="relative w-full sm:w-64">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                >
                  <option value="">All Events</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            {filteredRegistrations.length > 0 ? (
              <Card hoverEffect={false} className="border-slate-900 p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950/60 font-mono text-xs text-slate-500">
                        <th className="py-4 px-6 font-semibold">Student</th>
                        <th className="py-4 px-6 font-semibold">Event Target</th>
                        <th className="py-4 px-6 font-semibold">Date Registered</th>
                        <th className="py-4 px-6 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 text-sm text-slate-300">
                      {filteredRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-white">{reg.full_name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" /> {reg.email}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-200">
                            {reg.events?.title || 'General Registration'}
                          </td>
                          <td className="py-4 px-6 font-mono text-xs text-slate-400">
                            {new Date(reg.registered_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded capitalize">
                              <CheckCircle2 className="h-3.5 w-3.5" /> {reg.attendance_status || 'registered'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <div className="text-center py-12 bg-slate-900/10 border border-slate-900 rounded-xl">
                <p className="text-sm font-mono text-slate-500">No registrations found matching the filters.</p>
              </div>
            )}
          </div>
        )}

        {/* B. Sprints Manager */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {events.length > 0 ? (
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
                      {events.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-white">{ev.title}</div>
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
                              {ev.status !== 'published' && (
                                <button
                                  onClick={() => handleUpdateEventStatus(ev.id, 'published')}
                                  className="text-[10px] font-mono px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded transition-colors cursor-pointer"
                                >
                                  Publish
                                </button>
                              )}
                              {ev.status === 'published' && (
                                <button
                                  onClick={() => handleUpdateEventStatus(ev.id, 'completed')}
                                  className="text-[10px] font-mono px-2 py-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded transition-colors cursor-pointer"
                                >
                                  Complete
                                </button>
                              )}
                              {ev.status !== 'cancelled' && ev.status !== 'completed' && (
                                <button
                                  onClick={() => handleUpdateEventStatus(ev.id, 'cancelled')}
                                  className="text-[10px] font-mono px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                                title="Delete Event"
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
                <p className="text-sm font-mono text-slate-500">No events found in the database.</p>
              </div>
            )}
          </div>
        )}

        {/* C. Announcements Feed */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {announcements.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {announcements.map((announce) => {
                  const isScheduled = announce.publish_date && new Date(announce.publish_date) > new Date();
                  return (
                    <Card key={announce.id} hoverEffect={false} className="border-slate-900 bg-slate-950/20 p-5 flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded bg-emerald-500/10 border border-emerald-500/25">
                            <Megaphone className="h-4 w-4 text-emerald-400" />
                          </span>
                          <h3 className="font-bold text-white text-base">{announce.title}</h3>
                          <span className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[9px] font-mono font-medium border capitalize ${
                            announce.is_active 
                              ? isScheduled
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}>
                            {announce.is_active ? (isScheduled ? 'scheduled' : 'active') : 'inactive'}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">{announce.message}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1 font-mono">
                          <span>Publish Date: {new Date(announce.publish_date || announce.created_at).toLocaleString()}</span>
                          {announce.events && (
                            <span className="text-emerald-500/80">• Event: {announce.events.title}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleAnnouncementActive(announce.id, announce.is_active)}
                          className={`p-1.5 rounded border transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono ${
                            announce.is_active 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                          title={announce.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleEditAnnouncementClick(announce)}
                          className="text-slate-500 hover:text-emerald-400 p-1.5 hover:bg-slate-900/60 rounded transition-colors cursor-pointer"
                          title="Edit Announcement"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(announce.id)}
                          className="text-slate-500 hover:text-red-400 p-2 hover:bg-slate-900/40 rounded transition-colors cursor-pointer"
                          title="Delete Announcement"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900/10 border border-slate-900 rounded-xl">
                <p className="text-sm font-mono text-slate-500">No active announcements posted yet.</p>
              </div>
            )}
          </div>
        )}

        {/* D. Community Links Settings */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            {communityLinks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {communityLinks.map((link) => (
                  <Card key={link.id} hoverEffect={true} className="border-slate-900 bg-slate-950/20 p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-emerald-400" />
                        <h4 className="font-bold text-white font-mono">{link.platform}</h4>
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate max-w-xs">{link.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleLinkActive(link.id, link.is_active)}
                        className={`p-1.5 rounded border transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono ${
                          link.is_active 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                        title={link.is_active ? 'Active (Click to disable)' : 'Inactive (Click to enable)'}
                      >
                        <Power className="h-3.5 w-3.5" /> {link.is_active ? 'Active' : 'Offline'}
                      </button>
                      <button
                        onClick={() => handleEditLinkClick(link)}
                        className="text-slate-500 hover:text-emerald-400 p-1.5 hover:bg-slate-900/60 rounded transition-colors cursor-pointer"
                        title="Edit Link"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-slate-900/60 rounded transition-colors cursor-pointer"
                        title="Delete Link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900/10 border border-slate-900 rounded-xl">
                <p className="text-sm font-mono text-slate-500">No community link records found.</p>
              </div>
            )}
          </div>
        )}
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
                <Plus className="h-5 w-5 text-emerald-400" /> Create Sprint Event
              </h2>
              <button 
                onClick={() => setShowEventModal(false)}
                className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js Web Dev Camp"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    URL Slug *
                  </label>
                  <input
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
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Event Type
                  </label>
                  <select
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
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Mode
                  </label>
                  <select
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
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Publish Status
                  </label>
                  <select
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
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    End Time *
                  </label>
                  <input
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
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Meeting Stream Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={eventForm.meeting_link}
                    onChange={(e) => setEventForm({ ...eventForm, meeting_link: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Registration Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.registration_deadline}
                    onChange={(e) => setEventForm({ ...eventForm, registration_deadline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Banner Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={eventForm.banner_url}
                  onChange={(e) => setEventForm({ ...eventForm, banner_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="Brief one-liner summary of event learning outcomes"
                  value={eventForm.short_description}
                  onChange={(e) => setEventForm({ ...eventForm, short_description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Detailed Description (Supports MD/Plain)
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide details about curriculum, prerequisites, speaker bio, and schedule..."
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
                  {isSubmittingEvent ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Sprint Event'}
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
                <Megaphone className="h-5 w-5 text-emerald-400" /> {editingAnnounceId ? 'Edit Announcement' : 'Post Announcement'}
              </h2>
              <button 
                onClick={() => {
                  setShowAnnounceModal(false);
                  setEditingAnnounceId(null);
                  setAnnounceForm({ title: '', message: '', event_id: '', publish_date: '', is_active: true });
                }}
                className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discord Server Launch"
                  value={announceForm.title}
                  onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Event (Optional)
                </label>
                <select
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
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Publish Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={announceForm.publish_date}
                    onChange={(e) => setAnnounceForm({ ...announceForm, publish_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Message Content *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter announcement details..."
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
                  {isSubmittingAnnounce ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingAnnounceId ? 'Update Announcement' : 'Post to Feed')}
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
                <Link2 className="h-5 w-5 text-emerald-400" /> {editingLinkId ? 'Edit Community Link' : 'Add Community Link'}
              </h2>
              <button 
                onClick={() => {
                  setShowLinkModal(false);
                  setEditingLinkId(null);
                  setLinkForm({ platform: 'Discord', url: '', is_active: true });
                  setCustomPlatform('');
                }}
                className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Platform Name *
                </label>
                <select
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
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Platform Custom Name *
                  </label>
                  <input
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
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Platform URL *
                </label>
                <input
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
                  {isSubmittingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingLinkId ? 'Update Link' : 'Save Link')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
