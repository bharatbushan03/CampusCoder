'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Building2,
  PlusCircle,
  Search,
  Users,
  Calendar,
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Edit,
  Loader2,
  Mail,
  X,
  UserPlus,
  Trash2,
  ChevronRight,
  School,
  Download,
  Activity,
  CheckCircle,
  Clock,
  RotateCw,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '@/lib/api';
import { CampusCoderLoader } from '@/components/ui/CampusCoderLoader';

export interface ClubOrganizer {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  college: string | null;
  branch: string | null;
  year: string | null;
  created_at?: string;
}

export interface ClubItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  college?: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  organizersCount?: number;
  eventsCount?: number;
  organizers?: ClubOrganizer[];
}

export interface CampusOverviewItem {
  name: string;
  clubsCount: number;
  eventsCount: number;
  studentsCount: number;
  organizersCount: number;
  clubs: ClubItem[];
}

export interface CommunityConsoleData {
  club: ClubItem;
  organizers: ClubOrganizer[];
  students: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
    college: string | null;
    branch: string | null;
    year: string | null;
    created_at?: string;
  }>;
  events: {
    all: any[];
    upcoming: any[];
    inProgress: any[];
    preCompleted: any[];
  };
  registrations: Array<{
    id: string;
    full_name: string;
    email: string;
    phone?: string | null;
    college?: string | null;
    branch?: string | null;
    year?: string | null;
    coding_level?: string | null;
    preferred_language?: string | null;
    attendance_status: 'registered' | 'attended' | 'absent';
    registered_at: string;
    event_id: string;
    event?: { id: string; title: string; slug: string; date: string } | null;
    events?: { id: string; title: string; slug: string; date: string } | null;
  }>;
  analytics: {
    totalRegistrations: number;
    attendedCount: number;
    attendanceRate: number;
    totalEvents: number;
    upcomingCount: number;
    inProgressCount: number;
    completedCount: number;
    studentsCount: number;
    organizersCount: number;
    branchDistribution: { branch: string; count: number }[];
    yearDistribution: { year: string; count: number }[];
  };
}

function AdminCampusesPageContent() {
  const searchParams = useSearchParams();
  const initialCampusParam = searchParams.get('campus');
  const initialClubParam = searchParams.get('club');
  const initialTabParam = searchParams.get('tab');

  const [loading, setLoading] = useState(true);
  const [campuses, setCampuses] = useState<CampusOverviewItem[]>([]);
  const [allClubs, setAllClubs] = useState<ClubItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<string | null>(initialCampusParam || null);
  const [selectedClub, setSelectedClub] = useState<ClubItem | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Level 3 Community Console state
  const [consoleData, setConsoleData] = useState<CommunityConsoleData | null>(null);
  const [loadingConsole, setLoadingConsole] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'telemetry' | 'events' | 'registrations' | 'students' | 'organizers'>('telemetry');
  const [eventsFilterSegment, setEventsFilterSegment] = useState<'all' | 'upcoming' | 'inProgress' | 'preCompleted'>('all');

  // Filter & Search inside Level 3
  const [regSearchQuery, setRegSearchQuery] = useState('');
  const [regEventFilter, setRegEventFilter] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState<string>('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');

  // Modals state
  const [showAddCampusModal, setShowAddCampusModal] = useState(false);
  const [newCampusName, setNewCampusName] = useState('');
  const [registeringCampus, setRegisteringCampus] = useState(false);
  const [campusModalError, setCampusModalError] = useState('');

  const [showClubModal, setShowClubModal] = useState(false);
  const [editingClub, setEditingClub] = useState<ClubItem | null>(null);
  const [clubFormData, setClubFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'Technical',
    college: '',
    is_active: true,
  });
  const [clubSubmitting, setClubSubmitting] = useState(false);
  const [clubFormError, setClubFormError] = useState('');

  const [appointModalClub, setAppointModalClub] = useState<ClubItem | null>(null);
  const [candidates, setCandidates] = useState<
    Array<{
      id: string;
      full_name: string | null;
      email: string | null;
      college: string | null;
      branch: string | null;
      year: string | null;
    }>
  >([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [appointSubmitting, setAppointSubmitting] = useState(false);

  // Category filter inside Level 2 (Selected campus)
  const [clubCategoryFilter, setClubCategoryFilter] = useState('ALL');
  const [clubSearchQuery, setClubSearchQuery] = useState('');

  // Deletion state
  const [deletingCampus, setDeletingCampus] = useState<string | null>(null);
  const [isDeletingCampus, setIsDeletingCampus] = useState(false);
  const [deleteCampusError, setDeleteCampusError] = useState('');

  const [deletingClub, setDeletingClub] = useState<ClubItem | null>(null);
  const [isDeletingClub, setIsDeletingClub] = useState(false);
  const [deleteClubError, setDeleteClubError] = useState('');

  // Load campuses and clubs
  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewData, clubsData] = await Promise.all([
        api<{ ok: boolean; campuses: CampusOverviewItem[] }>('/colleges/overview').catch(() => null),
        api<{ ok: boolean; clubs: ClubItem[] }>('/clubs/admin/all').catch(() => null),
      ]);

      if (clubsData?.clubs) {
        setAllClubs(clubsData.clubs);
      }

      if (overviewData?.campuses) {
        const enrichedCampuses = overviewData.campuses.map((camp) => {
          const matchingClubs = (clubsData?.clubs || []).filter(
            (c) => (c.college || 'MIET').trim().toUpperCase() === camp.name.trim().toUpperCase()
          );
          return {
            ...camp,
            clubsCount: matchingClubs.length > 0 ? matchingClubs.length : camp.clubsCount,
            clubs: matchingClubs.length > 0 ? matchingClubs : camp.clubs,
          };
        });
        setCampuses(enrichedCampuses);
      } else {
        const colList = await api<{ ok: boolean; colleges: string[] }>('/colleges').catch(() => ({
          ok: true,
          colleges: ['MIET'],
        }));
        const rawColleges = colList.colleges || ['MIET'];
        const fallbackList: CampusOverviewItem[] = rawColleges.map((name) => {
          const matched = (clubsData?.clubs || []).filter(
            (c) => (c.college || 'MIET').trim().toUpperCase() === name.trim().toUpperCase()
          );
          return {
            name,
            clubsCount: matched.length,
            eventsCount: 0,
            studentsCount: 0,
            organizersCount: 0,
            clubs: matched,
          };
        });
        setCampuses(fallbackList);
      }
    } catch (err: any) {
      console.warn('Error loading campuses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch Community Console Data (Level 3)
  const loadCommunityConsole = async (club: ClubItem) => {
    setSelectedClub(club);
    setLoadingConsole(true);
    try {
      const data = await api<CommunityConsoleData>(`/admin/clubs/${club.slug}/console`);
      if (data && data.club) {
        setConsoleData(data);
      }
    } catch (err: any) {
      console.warn('Failed to load community console data:', err);
      // Fallback
      setConsoleData({
        club,
        organizers: club.organizers || [],
        students: [],
        events: { all: [], upcoming: [], inProgress: [], preCompleted: [] },
        registrations: [],
        analytics: {
          totalRegistrations: 0,
          attendedCount: 0,
          attendanceRate: 0,
          totalEvents: 0,
          upcomingCount: 0,
          inProgressCount: 0,
          completedCount: 0,
          studentsCount: 0,
          organizersCount: club.organizers?.length || 0,
          branchDistribution: [],
          yearDistribution: [],
        },
      });
    } finally {
      setLoadingConsole(false);
    }
  };

  // Sync initial query params
  useEffect(() => {
    if (initialCampusParam) {
      setSelectedCampus(initialCampusParam);
    }
    if (initialClubParam && allClubs.length > 0) {
      const found = allClubs.find(
        (c) => c.slug.toLowerCase() === initialClubParam.toLowerCase() || c.id === initialClubParam
      );
      if (found) {
        setSelectedCampus(found.college || 'MIET');
        loadCommunityConsole(found);
      }
    }
    if (initialTabParam) {
      const validTabs = ['telemetry', 'events', 'registrations', 'students', 'organizers'] as const;
      if (validTabs.includes(initialTabParam as any)) {
        setActiveConsoleTab(initialTabParam as any);
      }
    }
  }, [initialCampusParam, initialClubParam, initialTabParam, allClubs]);

  // Aggregate stats across all campuses (Level 1)
  const totalStats = useMemo(() => {
    const totalCampuses = campuses.length;
    const totalClubs = allClubs.length;
    const totalStudents = campuses.reduce((acc, c) => acc + c.studentsCount, 0);
    const totalEvents = campuses.reduce((acc, c) => acc + c.eventsCount, 0);
    return { totalCampuses, totalClubs, totalStudents, totalEvents };
  }, [campuses, allClubs]);

  // Filtered campuses list (Level 1)
  const filteredCampuses = useMemo(() => {
    if (!searchQuery.trim()) return campuses;
    return campuses.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [campuses, searchQuery]);

  // Clubs for the currently selected campus (Level 2)
  const currentCampusClubs = useMemo(() => {
    if (!selectedCampus) return [];
    const norm = selectedCampus.trim().toUpperCase();
    return allClubs.filter((c) => (c.college || 'MIET').trim().toUpperCase() === norm);
  }, [allClubs, selectedCampus]);

  const filteredCurrentClubs = useMemo(() => {
    return currentCampusClubs.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(clubSearchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(clubSearchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(clubSearchQuery.toLowerCase()));
      const matchesCat = clubCategoryFilter === 'ALL' || c.category === clubCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [currentCampusClubs, clubSearchQuery, clubCategoryFilter]);

  const campusCategories = useMemo(() => {
    const cats = new Set(currentCampusClubs.map((c) => c.category).filter(Boolean));
    return ['ALL', ...Array.from(cats)];
  }, [currentCampusClubs]);

  // Events filtered by segment in Level 3
  const displayedEvents = useMemo(() => {
    if (!consoleData) return [];
    let list: any[] = [];
    if (eventsFilterSegment === 'upcoming') {
      list = consoleData.events.upcoming;
    } else if (eventsFilterSegment === 'inProgress') {
      list = consoleData.events.inProgress;
    } else if (eventsFilterSegment === 'preCompleted') {
      list = consoleData.events.preCompleted;
    } else {
      list = consoleData.events.all;
    }

    if (eventSearchQuery.trim()) {
      const q = eventSearchQuery.toLowerCase();
      list = list.filter((e) => e.title?.toLowerCase().includes(q) || e.mode?.toLowerCase().includes(q));
    }
    return list;
  }, [consoleData, eventsFilterSegment, eventSearchQuery]);

  // Registrations filtered in Level 3
  const displayedRegistrations = useMemo(() => {
    if (!consoleData) return [];
    return consoleData.registrations.filter((r) => {
      const matchesQuery =
        !regSearchQuery.trim() ||
        r.full_name?.toLowerCase().includes(regSearchQuery.toLowerCase()) ||
        r.email?.toLowerCase().includes(regSearchQuery.toLowerCase()) ||
        r.branch?.toLowerCase().includes(regSearchQuery.toLowerCase());

      const matchesEvent = !regEventFilter || r.event_id === regEventFilter;
      const matchesStatus = regStatusFilter === 'all' || r.attendance_status === regStatusFilter;

      return matchesQuery && matchesEvent && matchesStatus;
    });
  }, [consoleData, regSearchQuery, regEventFilter, regStatusFilter]);

  // Students filtered in Level 3
  const displayedStudents = useMemo(() => {
    if (!consoleData) return [];
    if (!studentSearchQuery.trim()) return consoleData.students;
    const q = studentSearchQuery.toLowerCase();
    return consoleData.students.filter(
      (s) => s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.branch?.toLowerCase().includes(q)
    );
  }, [consoleData, studentSearchQuery]);

  // Attendance toggle action
  const handleUpdateAttendance = async (regId: string, newStatus: 'registered' | 'attended' | 'absent') => {
    try {
      await api(`/admin/registrations/${regId}/attendance`, {
        method: 'PATCH',
        body: JSON.stringify({ attendance_status: newStatus }),
      });

      setConsoleData((prev) => {
        if (!prev) return prev;
        const updatedRegs = prev.registrations.map((r) =>
          r.id === regId ? { ...r, attendance_status: newStatus } : r
        );
        const attendedCount = updatedRegs.filter((r) => r.attendance_status === 'attended').length;
        const attendanceRate = updatedRegs.length > 0 ? Math.round((attendedCount / updatedRegs.length) * 100) : 0;
        return {
          ...prev,
          registrations: updatedRegs,
          analytics: {
            ...prev.analytics,
            attendedCount,
            attendanceRate,
          },
        };
      });

      setActionFeedback({
        type: 'success',
        text: `Attendance updated to ${newStatus}`,
      });
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        text: err.message || 'Failed to update attendance',
      });
    }
  };

  // Export CSV of community registrations
  const handleExportCSV = () => {
    if (!consoleData || displayedRegistrations.length === 0) return;
    const headers = ['Name', 'Email', 'Phone', 'Event', 'Date', 'Branch', 'Year', 'Coding Level', 'Status', 'Registered At'];
    const rows = displayedRegistrations.map((r) => [
      `"${r.full_name || ''}"`,
      `"${r.email || ''}"`,
      `"${r.phone || ''}"`,
      `"${(r.event as any)?.title || (r.events as any)?.title || ''}"`,
      `"${(r.event as any)?.date || ''}"`,
      `"${r.branch || ''}"`,
      `"${r.year || ''}"`,
      `"${r.coding_level || ''}"`,
      `"${r.attendance_status}"`,
      `"${new Date(r.registered_at).toLocaleString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${consoleData.club.slug}_registrations_ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Register New Campus
  const handleRegisterCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampusName.trim()) {
      setCampusModalError('Please enter a campus name.');
      return;
    }
    setRegisteringCampus(true);
    setCampusModalError('');
    try {
      const res = await api<{ ok: boolean; college: string; club?: any; organizerAssigned?: boolean }>('/colleges', {
        method: 'POST',
        body: JSON.stringify({ name: newCampusName.trim() }),
      });
      if (res.ok) {
        const feedbackMsg = res.organizerAssigned
          ? `Campus "${res.college}" registered! Created "hackerrankcampuscrew" and assigned first member as organizer.`
          : `Campus "${res.college}" registered! Automatically initialized "hackerrankcampuscrew" chapter.`;
        setActionFeedback({
          type: 'success',
          text: feedbackMsg,
        });
        setTimeout(() => setActionFeedback(null), 5000);
        setShowAddCampusModal(false);
        setNewCampusName('');
        await loadData();
        setSelectedCampus(res.college);
        setSelectedClub(null);
      }
    } catch (err: any) {
      setCampusModalError(err.message || 'Failed to register campus');
    } finally {
      setRegisteringCampus(false);
    }
  };

  // Create or edit club
  const openCreateClubModal = (campusName: string) => {
    setEditingClub(null);
    setClubFormData({
      name: '',
      slug: '',
      description: '',
      category: 'Technical',
      college: campusName,
      is_active: true,
    });
    setClubFormError('');
    setShowClubModal(true);
  };

  const openEditClubModal = (club: ClubItem) => {
    setEditingClub(club);
    setClubFormData({
      name: club.name,
      slug: club.slug,
      description: club.description || '',
      category: club.category || 'Technical',
      college: club.college || selectedCampus || 'MIET',
      is_active: club.is_active,
    });
    setClubFormError('');
    setShowClubModal(true);
  };

  const handleClubFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubFormData.name.trim() || !clubFormData.slug.trim()) {
      setClubFormError('Club name and slug are required.');
      return;
    }
    setClubSubmitting(true);
    setClubFormError('');

    try {
      if (editingClub) {
        await api(`/clubs/admin/${editingClub.id}`, {
          method: 'PUT',
          body: JSON.stringify(clubFormData),
        });
        setActionFeedback({
          type: 'success',
          text: `Community "${clubFormData.name}" updated successfully!`,
        });
      } else {
        await api('/clubs/admin', {
          method: 'POST',
          body: JSON.stringify(clubFormData),
        });
        setActionFeedback({
          type: 'success',
          text: `Community "${clubFormData.name}" created for ${clubFormData.college}!`,
        });
      }
      setTimeout(() => setActionFeedback(null), 4000);
      setShowClubModal(false);
      await loadData();
      if (selectedClub && editingClub && selectedClub.id === editingClub.id) {
        loadCommunityConsole({ ...selectedClub, ...clubFormData });
      }
    } catch (err: any) {
      setClubFormError(err.message || 'Failed to save club');
    } finally {
      setClubSubmitting(false);
    }
  };

  // Appoint organizer
  const openAppointModal = async (club: ClubItem) => {
    setAppointModalClub(club);
    setSelectedCandidateId('');
    setLoadingCandidates(true);
    try {
      const clubCollege = (club.college || selectedCampus || 'MIET').trim();
      const res = await api<{ ok: boolean; students: any[] }>(
        `/clubs/admin/candidates?clubId=${encodeURIComponent(club.id)}&college=${encodeURIComponent(clubCollege)}`
      );
      if (res?.ok && res.students) {
        const normClubCollege = clubCollege.toUpperCase();
        const collegeCandidates = res.students.filter(
          (s) => ((s.college || 'MIET').trim().toUpperCase() === normClubCollege)
        );
        setCandidates(collegeCandidates);
      } else {
        setCandidates([]);
      }
    } catch (err: any) {
      console.warn('Failed to load candidate students:', err);
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleAppointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointModalClub || !selectedCandidateId) return;

    setAppointSubmitting(true);
    try {
      const res = await api<{ ok: boolean; organizer: ClubOrganizer }>(
        `/clubs/admin/${appointModalClub.id}/organizers`,
        {
          method: 'POST',
          body: JSON.stringify({ studentId: selectedCandidateId }),
        }
      );

      if (res.ok && res.organizer) {
        const newOrg = res.organizer;
        setAllClubs((prev) =>
          prev.map((c) => {
            if (c.id !== appointModalClub.id) return c;
            const updatedOrgs = [...(c.organizers || []), newOrg];
            return {
              ...c,
              organizers: updatedOrgs,
              organizersCount: updatedOrgs.length,
            };
          })
        );

        if (consoleData && consoleData.club.id === appointModalClub.id) {
          const updatedOrgs = [...consoleData.organizers, newOrg];
          setConsoleData({
            ...consoleData,
            organizers: updatedOrgs,
            analytics: {
              ...consoleData.analytics,
              organizersCount: updatedOrgs.length,
            },
          });
        }

        setActionFeedback({
          type: 'success',
          text: `${newOrg.full_name || newOrg.email} is now an organizer for ${appointModalClub.name}!`,
        });
        setTimeout(() => setActionFeedback(null), 4000);
        setAppointModalClub(null);
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        text: err.message || 'Failed to appoint organizer',
      });
    } finally {
      setAppointSubmitting(false);
    }
  };

  const handleRemoveOrganizer = async (clubId: string, organizerId: string, orgName: string) => {
    if (!confirm(`Remove ${orgName} as organizer? They will revert to a student role.`)) return;
    try {
      await api(`/clubs/admin/${clubId}/organizers/${organizerId}`, {
        method: 'DELETE',
      });

      setAllClubs((prev) =>
        prev.map((c) => {
          if (c.id !== clubId) return c;
          const updatedOrgs = (c.organizers || []).filter((o) => o.id !== organizerId);
          return {
            ...c,
            organizers: updatedOrgs,
            organizersCount: updatedOrgs.length,
          };
        })
      );

      if (consoleData && consoleData.club.id === clubId) {
        const updatedOrgs = consoleData.organizers.filter((o) => o.id !== organizerId);
        setConsoleData({
          ...consoleData,
          organizers: updatedOrgs,
          analytics: {
            ...consoleData.analytics,
            organizersCount: updatedOrgs.length,
          },
        });
      }

      setActionFeedback({
        type: 'success',
        text: `${orgName} was removed from club organizers and reverted to student.`,
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        text: err.message || 'Failed to remove organizer',
      });
    }
  };

  const handleDeleteCampusSubmit = async () => {
    if (!deletingCampus) return;
    setIsDeletingCampus(true);
    setDeleteCampusError('');
    try {
      const res = await api<{ ok: boolean; message: string; stats?: any }>(
        `/colleges/admin/${encodeURIComponent(deletingCampus)}`,
        { method: 'DELETE' }
      );
      setActionFeedback({
        type: 'success',
        text: res.message || `Campus "${deletingCampus}" deleted. All students and organizers redirected to MIET.`,
      });
      setTimeout(() => setActionFeedback(null), 5000);

      if (selectedCampus && selectedCampus.trim().toUpperCase() === deletingCampus.trim().toUpperCase()) {
        setSelectedCampus(null);
        setSelectedClub(null);
        setConsoleData(null);
      }

      setDeletingCampus(null);
      await loadData();
    } catch (err: any) {
      setDeleteCampusError(err.message || 'Failed to delete campus');
    } finally {
      setIsDeletingCampus(false);
    }
  };

  const handleDeleteClubSubmit = async () => {
    if (!deletingClub) return;
    setIsDeletingClub(true);
    setDeleteClubError('');
    try {
      const res = await api<{ ok: boolean; message: string }>(
        `/clubs/admin/${deletingClub.id}`,
        { method: 'DELETE' }
      );
      setActionFeedback({
        type: 'success',
        text: res.message || `Club "${deletingClub.name}" deleted. Any organizers have been reverted to student.`,
      });
      setTimeout(() => setActionFeedback(null), 5000);

      if (selectedClub && selectedClub.id === deletingClub.id) {
        setSelectedClub(null);
        setConsoleData(null);
      }

      if (editingClub && editingClub.id === deletingClub.id) {
        setShowClubModal(false);
        setEditingClub(null);
      }

      setDeletingClub(null);
      await loadData();
    } catch (err: any) {
      setDeleteClubError(err.message || 'Failed to delete club');
    } finally {
      setIsDeletingClub(false);
    }
  };

  if (loading) {
    return <CampusCoderLoader text="Loading Campuses & Communities..." />;
  }

  return (
    <div className="space-y-6">
      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{actionFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Breadcrumb Navigation Hierarchy */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 flex-wrap">
        <Link href="/admin/dashboard" className="hover:text-emerald-400 transition-colors">
          Admin Console
        </Link>
        <ChevronRight className="size-3.5 text-slate-600" />
        {selectedCampus ? (
          <>
            <button
              type="button"
              onClick={() => {
                setSelectedCampus(null);
                setSelectedClub(null);
              }}
              className="hover:text-emerald-400 transition-colors"
            >
              Campuses
            </button>
            <ChevronRight className="size-3.5 text-slate-600" />
            {selectedClub ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedClub(null)}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {selectedCampus}
                </button>
                <ChevronRight className="size-3.5 text-slate-600" />
                <span className="text-emerald-400 font-semibold">{selectedClub.name} Console</span>
              </>
            ) : (
              <span className="text-emerald-400 font-semibold">{selectedCampus}</span>
            )}
          </>
        ) : (
          <span className="text-white font-semibold">Campuses</span>
        )}
      </div>

      {/* ========================================================================= */}
      {/* LEVEL 1: ALL CAMPUSES DIRECTORY (DEFAULT)                                 */}
      {/* ========================================================================= */}
      {!selectedCampus && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                University Campuses
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Choose a campus to access its affiliated technical clubs, student communities, and organizers console.
              </p>
            </div>

            <Button
              onClick={() => {
                setNewCampusName('');
                setCampusModalError('');
                setShowAddCampusModal(true);
              }}
              variant="primary"
              className="flex items-center gap-2 self-start sm:self-auto shrink-0"
            >
              <PlusCircle className="size-4" /> Register Campus
            </Button>
          </div>

          {/* Metric Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card hoverEffect={false} className="border-slate-800/80 bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <School className="size-4 text-emerald-400" />
                <span>Total Campuses</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1 font-mono">{totalStats.totalCampuses}</p>
            </Card>

            <Card hoverEffect={false} className="border-slate-800/80 bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Shield className="size-4 text-sky-400" />
                <span>Active Clubs</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1 font-mono">{totalStats.totalClubs}</p>
            </Card>

            <Card hoverEffect={false} className="border-slate-800/80 bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Users className="size-4 text-purple-400" />
                <span>Enrolled Students</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1 font-mono">{totalStats.totalStudents}</p>
            </Card>

            <Card hoverEffect={false} className="border-slate-800/80 bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Calendar className="size-4 text-amber-400" />
                <span>Campus Events</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1 font-mono">{totalStats.totalEvents}</p>
            </Card>
          </div>

          {/* Search Toolbar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search campuses by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Campuses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCampuses.map((campus) => {
              const campusClubs = allClubs.filter(
                (c) => (c.college || 'MIET').trim().toUpperCase() === campus.name.trim().toUpperCase()
              );
              const clubCount = campusClubs.length > 0 ? campusClubs.length : campus.clubsCount;

              return (
                <div
                  key={campus.name}
                  onClick={() => {
                    setSelectedCampus(campus.name);
                    setSelectedClub(null);
                  }}
                  className="group relative cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-emerald-500/40 transition-all duration-200 p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Campus Name & Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                          <Building2 className="size-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {campus.name}
                          </h2>
                          <span className="text-[11px] font-mono text-slate-500">
                            Campus Directory
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {campus.name.toUpperCase() === 'MIET' ? (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            Default HQ
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingCampus(campus.name);
                              setDeleteCampusError('');
                            }}
                            className="size-8 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
                            title={`Delete campus ${campus.name} (Students will be redirected to MIET)`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300">
                          {clubCount} {clubCount === 1 ? 'Club' : 'Clubs'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-800/60 text-center font-mono">
                      <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/40">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Clubs</p>
                        <p className="text-sm font-bold text-white mt-0.5">{clubCount}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/40">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Students</p>
                        <p className="text-sm font-bold text-emerald-400 mt-0.5">{campus.studentsCount}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/40">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Events</p>
                        <p className="text-sm font-bold text-sky-400 mt-0.5">{campus.eventsCount}</p>
                      </div>
                    </div>

                    {/* Clubs Tags Preview */}
                    <div className="mt-4 space-y-1.5">
                      <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                        Chapters & Clubs:
                      </p>
                      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                        {campusClubs.length > 0 ? (
                          campusClubs.slice(0, 4).map((c) => (
                            <span
                              key={c.id}
                              className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50 text-slate-300"
                            >
                              {c.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">No clubs registered yet</span>
                        )}
                        {campusClubs.length > 4 && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded-md bg-slate-800/50 text-slate-400">
                            +{campusClubs.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Action */}
                  <div className="mt-6 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-emerald-400 group-hover:text-emerald-300">
                    <span>Explore Campus Clubs</span>
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}

            {filteredCampuses.length === 0 && (
              <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
                <School className="size-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No campuses matched &quot;{searchQuery}&quot;</p>
                <Button
                  onClick={() => setShowAddCampusModal(true)}
                  variant="secondary"
                  className="mt-4 text-xs"
                >
                  Register &quot;{searchQuery}&quot; as New Campus
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: DRILL-DOWN INTO SELECTED CAMPUS CLUBS                           */}
      {/* ========================================================================= */}
      {selectedCampus && !selectedClub && (
        <div className="space-y-6">
          {/* Selected Campus Banner & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03]">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedCampus(null);
                  setSelectedClub(null);
                }}
                className="mt-1 size-9 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
                title="Back to All Campuses"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-white tracking-tight">{selectedCampus}</h1>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    Campus Scoped View
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Click on any club or community below to enter its full console, view registrations, events, and student data.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="secondary"
                onClick={() => setSelectedCampus(null)}
                className="flex items-center gap-2 text-xs"
              >
                <ArrowLeft className="size-3.5" /> All Campuses
              </Button>
              {selectedCampus.toUpperCase() !== 'MIET' && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDeletingCampus(selectedCampus);
                    setDeleteCampusError('');
                  }}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:border-red-500/40 hover:bg-red-500/10"
                >
                  <Trash2 className="size-3.5" /> Delete Campus
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => openCreateClubModal(selectedCampus)}
                className="flex items-center gap-2 text-xs"
              >
                <PlusCircle className="size-4" /> Add Club to {selectedCampus}
              </Button>
            </div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input
                type="text"
                placeholder={`Search clubs in ${selectedCampus}...`}
                value={clubSearchQuery}
                onChange={(e) => setClubSearchQuery(e.target.value)}
                className="w-full bg-slate-900/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {campusCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setClubCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors ${
                    clubCategoryFilter === cat
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Clubs Grid for Selected Campus */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCurrentClubs.map((club) => {
              const orgCount = club.organizers?.length ?? club.organizersCount ?? 0;
              const evCount = club.eventsCount ?? 0;

              return (
                <div
                  key={club.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-200"
                >
                  <div>
                    {/* Club Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold font-mono">
                          {club.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">{club.name}</h3>
                          <span className="text-xs font-mono text-slate-400">/c/{club.slug}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            club.is_active
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {club.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Category pill */}
                    <div className="mt-3">
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/40 text-sky-400">
                        {club.category}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                      {club.description || 'No description provided for this club.'}
                    </p>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/60 text-xs font-mono">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Users className="size-3.5 text-purple-400 shrink-0" />
                        <span>{orgCount} {orgCount === 1 ? 'Organizer' : 'Organizers'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="size-3.5 text-amber-400 shrink-0" />
                        <span>{evCount} {evCount === 1 ? 'Event' : 'Events'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar - Primary action opens the full Community Console */}
                  <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => loadCommunityConsole(club)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-mono"
                    >
                      <Activity className="size-3.5" /> Open Community Console →
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openAppointModal(club)}
                      className="flex items-center justify-center gap-1.5 text-xs font-mono"
                      title="Appoint Student Organizer"
                    >
                      <UserPlus className="size-3.5 text-emerald-400" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditClubModal(club)}
                      className="flex items-center justify-center gap-1.5 text-xs font-mono"
                      title="Edit Club"
                    >
                      <Edit className="size-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setDeletingClub(club);
                        setDeleteClubError('');
                      }}
                      className="flex items-center justify-center gap-1.5 text-xs font-mono hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 text-slate-400"
                      title="Delete Club"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {filteredCurrentClubs.length === 0 && (
              <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
                <Shield className="size-8 text-slate-600 mx-auto mb-2" />
                <h3 className="text-base font-bold text-white">No clubs found for {selectedCampus}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {clubSearchQuery
                    ? `No clubs matching "${clubSearchQuery}".`
                    : `There are currently no active clubs registered for this campus.`}
                </p>
                <Button
                  onClick={() => openCreateClubModal(selectedCampus)}
                  variant="primary"
                  className="mt-4 text-xs"
                >
                  <PlusCircle className="size-4 mr-1.5" /> Create First Club for {selectedCampus}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 3: FULL COMMUNITY & ORGANIZERS' CONSOLE                             */}
      {/* ========================================================================= */}
      {selectedCampus && selectedClub && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Community Hero Header */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedClub(null)}
                  className="mt-1 size-10 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
                  title={`Back to ${selectedCampus} Clubs`}
                >
                  <ArrowLeft className="size-5" />
                </button>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                      {selectedClub.name}
                    </h1>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400">
                      {selectedClub.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        selectedClub.is_active
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {selectedClub.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono flex-wrap">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <School className="size-3.5" /> {selectedCampus}
                    </span>
                    <span>•</span>
                    <span>/c/{selectedClub.slug}</span>
                    <span>•</span>
                    <span>Community Organizer Console</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => loadCommunityConsole(selectedClub)}
                  disabled={loadingConsole}
                  className="flex items-center gap-1.5 text-xs font-mono"
                  title="Reload community console"
                >
                  <RotateCw className={`size-3.5 ${loadingConsole ? 'animate-spin' : ''}`} /> Refresh
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openAppointModal(selectedClub)}
                  className="flex items-center gap-1.5 text-xs font-mono"
                >
                  <UserPlus className="size-3.5 text-purple-400" /> Appoint Organizer
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditClubModal(selectedClub)}
                  className="flex items-center gap-1.5 text-xs font-mono"
                >
                  <Edit className="size-3.5" /> Edit Info
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDeletingClub(selectedClub);
                    setDeleteClubError('');
                  }}
                  className="flex items-center gap-1.5 text-xs font-mono text-red-400 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10"
                >
                  <Trash2 className="size-3.5" /> Delete Club
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedClub(null)}
                  className="flex items-center gap-1.5 text-xs font-mono"
                >
                  <ArrowLeft className="size-3.5" /> All {selectedCampus} Clubs
                </Button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800/80 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveConsoleTab('telemetry')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeConsoleTab === 'telemetry'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <Activity className="size-3.5" /> Console & Telemetry
              </button>

              <button
                type="button"
                onClick={() => setActiveConsoleTab('events')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeConsoleTab === 'events'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <Calendar className="size-3.5" /> Events ({(consoleData?.events.all || []).length})
              </button>

              <button
                type="button"
                onClick={() => setActiveConsoleTab('registrations')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeConsoleTab === 'registrations'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="size-3.5" /> Registrations ({(consoleData?.registrations || []).length})
              </button>

              <button
                type="button"
                onClick={() => setActiveConsoleTab('students')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeConsoleTab === 'students'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <Users className="size-3.5" /> Campus Students ({(consoleData?.students || []).length})
              </button>

              <button
                type="button"
                onClick={() => setActiveConsoleTab('organizers')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeConsoleTab === 'organizers'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <Shield className="size-3.5" /> Organizers ({(consoleData?.organizers || []).length})
              </button>
            </div>
          </div>

          {loadingConsole ? (
            <div className="py-16 text-center">
              <Loader2 className="size-8 animate-spin text-emerald-400 mx-auto mb-3" />
              <p className="text-xs font-mono text-slate-400">Loading community telemetry & data...</p>
            </div>
          ) : consoleData ? (
            <>
              {/* ------------------------------------------------------------- */}
              {/* TAB 1: TELEMETRY & ORGANIZERS' CONSOLE OVERVIEW               */}
              {/* ------------------------------------------------------------- */}
              {activeConsoleTab === 'telemetry' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card hoverEffect={false} className="border-slate-800/80 bg-slate-900/40 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Total RSVPs</p>
                      <p className="text-2xl font-bold font-mono text-white mt-1">
                        {consoleData.analytics.totalRegistrations}
                      </p>
                    </Card>

                    <Card hoverEffect={false} className="border-slate-800/80 bg-slate-900/40 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Attended RSVPs</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold font-mono text-emerald-400">
                          {consoleData.analytics.attendedCount}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ({consoleData.analytics.attendanceRate}%)
                        </span>
                      </div>
                    </Card>

                    <Card hoverEffect={false} className="border-slate-800/80 bg-slate-900/40 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Total Events</p>
                      <p className="text-2xl font-bold font-mono text-sky-400 mt-1">
                        {consoleData.analytics.totalEvents}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {consoleData.analytics.upcomingCount} upcoming • {consoleData.analytics.completedCount} concluded
                      </p>
                    </Card>

                    <Card hoverEffect={false} className="border-slate-800/80 bg-slate-900/40 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Campus Students</p>
                      <p className="text-2xl font-bold font-mono text-purple-400 mt-1">
                        {consoleData.analytics.studentsCount}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {consoleData.analytics.organizersCount} appointed organizers
                      </p>
                    </Card>
                  </div>

                  {/* Distributions Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Branch Breakdown */}
                    <Card hoverEffect={false} className="border-slate-800 bg-slate-900/40 p-5">
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="size-4 text-emerald-400" /> Registrations by Branch
                      </h3>
                      {consoleData.analytics.branchDistribution.length > 0 ? (
                        <div className="space-y-3">
                          {consoleData.analytics.branchDistribution.slice(0, 6).map((b) => {
                            const percent = Math.round(
                              (b.count / (consoleData.analytics.totalRegistrations || 1)) * 100
                            );
                            return (
                              <div key={b.branch} className="space-y-1">
                                <div className="flex justify-between text-xs font-mono">
                                  <span className="text-slate-300">{b.branch}</span>
                                  <span className="text-slate-400">{b.count} ({percent}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 font-mono py-4">No registration branch telemetry yet.</p>
                      )}
                    </Card>

                    {/* Year Breakdown */}
                    <Card hoverEffect={false} className="border-slate-800 bg-slate-900/40 p-5">
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Calendar className="size-4 text-sky-400" /> Registrations by Graduation Year
                      </h3>
                      {consoleData.analytics.yearDistribution.length > 0 ? (
                        <div className="space-y-3">
                          {consoleData.analytics.yearDistribution.map((y) => {
                            const percent = Math.round(
                              (y.count / (consoleData.analytics.totalRegistrations || 1)) * 100
                            );
                            return (
                              <div key={y.year} className="space-y-1">
                                <div className="flex justify-between text-xs font-mono">
                                  <span className="text-slate-300">Class of {y.year}</span>
                                  <span className="text-slate-400">{y.count} ({percent}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-sky-500 rounded-full"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 font-mono py-4">No registration year telemetry yet.</p>
                      )}
                    </Card>
                  </div>

                  {/* Recent Activity Stream */}
                  <Card hoverEffect={false} className="border-slate-800 bg-slate-900/40 p-5">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Clock className="size-4 text-purple-400" /> Recent Registrations Stream
                    </h3>
                    {consoleData.registrations.length > 0 ? (
                      <div className="divide-y divide-slate-800/80">
                        {consoleData.registrations.slice(0, 6).map((reg) => (
                          <div key={reg.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold font-mono">
                                {(reg.full_name || 'S')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{reg.full_name}</p>
                                <p className="text-slate-400 font-mono text-[11px]">
                                  {reg.email} • {reg.branch || 'General'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-300 font-mono">
                                {(reg.event as any)?.title || (reg.events as any)?.title || 'Event'}
                              </p>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                  reg.attendance_status === 'attended'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : reg.attendance_status === 'absent'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                }`}
                              >
                                {reg.attendance_status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-mono py-4">No recent activity recorded.</p>
                    )}
                  </Card>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: EVENTS (UPCOMING, IN-PROGRESS, PRE-COMPLETED, ALL)     */}
              {/* ------------------------------------------------------------- */}
              {activeConsoleTab === 'events' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Sub-Tabs: Upcoming, In-Progress, Pre-Completed, All */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      <button
                        type="button"
                        onClick={() => setEventsFilterSegment('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors ${
                          eventsFilterSegment === 'all'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        All Events ({(consoleData.events.all || []).length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setEventsFilterSegment('upcoming')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                          eventsFilterSegment === 'upcoming'
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Clock className="size-3" /> Upcoming ({(consoleData.events.upcoming || []).length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setEventsFilterSegment('inProgress')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                          eventsFilterSegment === 'inProgress'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Radio className="size-3 animate-pulse text-amber-400" /> In-Progress ({(consoleData.events.inProgress || []).length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setEventsFilterSegment('preCompleted')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                          eventsFilterSegment === 'preCompleted'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CheckCircle className="size-3" /> Pre-Completed ({(consoleData.events.preCompleted || []).length})
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search events..."
                          value={eventSearchQuery}
                          onChange={(e) => setEventSearchQuery(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      <Link
                        href={`/admin/events/new?campus=${encodeURIComponent(selectedCampus || '')}&club=${encodeURIComponent(selectedClub?.id || '')}`}
                      >
                        <Button variant="primary" size="sm" className="whitespace-nowrap flex items-center gap-1.5 text-xs">
                          <PlusCircle className="size-3.5" /> Add Workshop
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Events Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayedEvents.map((ev: any) => {
                      const evRegs = consoleData.registrations.filter((r) => r.event_id === ev.id);

                      return (
                        <div
                          key={ev.id}
                          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-sky-400 uppercase">
                                {ev.event_type || 'Event'}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                  ev.status === 'published'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : ev.status === 'completed'
                                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}
                              >
                                {ev.status}
                              </span>
                            </div>

                            <h3 className="font-bold text-white text-base mt-2 line-clamp-1">{ev.title}</h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {ev.short_description || ev.description || 'No description provided.'}
                            </p>

                            <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-1.5 text-xs font-mono text-slate-400">
                              <div className="flex items-center gap-2">
                                <Calendar className="size-3.5 text-amber-400" />
                                <span>{ev.date} {ev.start_time ? `• ${ev.start_time}` : ''}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Activity className="size-3.5 text-sky-400" />
                                <span className="capitalize">{ev.mode || 'In-Person'} Mode</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRegEventFilter(ev.id);
                                setActiveConsoleTab('registrations');
                              }}
                              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
                            >
                              <Users className="size-3.5" />
                              <span>{evRegs.length} Attendees</span>
                            </button>

                            <Link
                              href={`/admin/events/${ev.id}/edit`}
                              className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              <Edit className="size-3" /> Edit
                            </Link>
                          </div>
                        </div>
                      );
                    })}

                    {displayedEvents.length === 0 && (
                      <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 font-mono text-xs text-slate-400">
                        No events found in this category.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 3: REGISTRATIONS LEDGER ("THE STUDENTS WHO REGISTERED")   */}
              {/* ------------------------------------------------------------- */}
              {activeConsoleTab === 'registrations' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Toolbar & Filter Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap flex-1">
                      {/* Search */}
                      <div className="relative min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search attendees..."
                          value={regSearchQuery}
                          onChange={(e) => setRegSearchQuery(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      {/* Event filter dropdown */}
                      <select
                        value={regEventFilter}
                        onChange={(e) => setRegEventFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 font-mono"
                      >
                        <option value="">All Community Events</option>
                        {consoleData.events.all.map((ev: any) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title}
                          </option>
                        ))}
                      </select>

                      {/* Attendance status filter */}
                      <select
                        value={regStatusFilter}
                        onChange={(e) => setRegStatusFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 font-mono"
                      >
                        <option value="all">All Attendance</option>
                        <option value="registered">Registered</option>
                        <option value="attended">Attended</option>
                        <option value="absent">Absent</option>
                      </select>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExportCSV}
                      disabled={displayedRegistrations.length === 0}
                      className="flex items-center gap-1.5 text-xs font-mono shrink-0"
                    >
                      <Download className="size-3.5" /> Export CSV ({displayedRegistrations.length})
                    </Button>
                  </div>

                  {/* Registrations Table */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Student</th>
                            <th className="py-3 px-4">Event</th>
                            <th className="py-3 px-4">Branch / Year</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Attendance Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-slate-300">
                          {displayedRegistrations.map((reg) => (
                            <tr key={reg.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-white font-sans text-sm">{reg.full_name}</div>
                                <div className="text-slate-400 text-xs font-mono">{reg.email}</div>
                                {reg.phone && <div className="text-slate-500 text-[11px]">{reg.phone}</div>}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="text-white font-sans font-medium line-clamp-1">
                                  {(reg.event as any)?.title || (reg.events as any)?.title || 'Event'}
                                </div>
                                <div className="text-slate-500 text-[11px] font-mono">
                                  {new Date(reg.registered_at).toLocaleDateString()}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-slate-400">
                                <div>{reg.branch || 'General'}</div>
                                <div className="text-[11px] text-slate-500">{reg.year ? `Year ${reg.year}` : 'Student'}</div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                                    reg.attendance_status === 'attended'
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                      : reg.attendance_status === 'absent'
                                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                      : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                                  }`}
                                >
                                  {reg.attendance_status}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateAttendance(reg.id, 'attended')}
                                    className={`px-2 py-1 rounded-md text-[10px] border transition-colors ${
                                      reg.attendance_status === 'attended'
                                        ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-500'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                    }`}
                                    title="Mark Attended"
                                  >
                                    Attended
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateAttendance(reg.id, 'absent')}
                                    className={`px-2 py-1 rounded-md text-[10px] border transition-colors ${
                                      reg.attendance_status === 'absent'
                                        ? 'bg-red-500 text-white font-bold border-red-500'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                    }`}
                                    title="Mark Absent"
                                  >
                                    Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {displayedRegistrations.length === 0 && (
                        <div className="py-12 text-center text-xs text-slate-400 font-mono">
                          No registration records match the current filters.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 4: CAMPUS STUDENTS ("ALL THE STUDENTS")                   */}
              {/* ------------------------------------------------------------- */}
              {activeConsoleTab === 'students' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Campus Student Directory</h3>
                      <p className="text-xs text-slate-400">
                        Students enrolled under {selectedCampus} affiliated with campus communities.
                      </p>
                    </div>

                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedStudents.map((st) => (
                      <div
                        key={st.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold font-mono shrink-0">
                            {(st.full_name || st.email || 'S')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate font-sans">{st.full_name || 'Student'}</p>
                            <p className="text-slate-400 font-mono text-[11px] truncate">{st.email}</p>
                            <p className="text-slate-500 font-mono text-[10px]">
                              {st.branch || 'Engineering'} {st.year ? `• Year ${st.year}` : ''}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedCandidateId(st.id);
                            openAppointModal(selectedClub);
                          }}
                          className="text-[11px] font-mono shrink-0 flex items-center gap-1"
                          title="Promote to organizer"
                        >
                          <UserPlus className="size-3 text-purple-400" /> Appoint
                        </Button>
                      </div>
                    ))}

                    {displayedStudents.length === 0 && (
                      <div className="col-span-full py-12 text-center text-xs text-slate-500 font-mono rounded-xl border border-dashed border-slate-800">
                        No students found registered for {selectedCampus}.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 5: APPOINTED ORGANIZERS ("ALL THE ORGANIZERS")            */}
              {/* ------------------------------------------------------------- */}
              {activeConsoleTab === 'organizers' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Appointed Community Organizers</h3>
                      <p className="text-xs text-slate-400">
                        Students holding organizer credentials for {selectedClub.name}.
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openAppointModal(selectedClub)}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <UserPlus className="size-3.5" /> Appoint Organizer
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {consoleData.organizers.map((org) => (
                      <div
                        key={org.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="size-11 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-base font-mono shrink-0">
                            {(org.full_name || org.email || 'O')[0].toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-base">{org.full_name || 'Organizer'}</h4>
                            <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                              <Mail className="size-3 text-slate-500" /> {org.email}
                            </p>
                            <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[11px] font-mono text-slate-400">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                                {org.branch || 'Branch'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                                {org.year ? `Year ${org.year}` : 'Student'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {selectedCampus}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveOrganizer(
                              selectedClub.id,
                              org.id,
                              org.full_name || org.email || 'Organizer'
                            )
                          }
                          className="text-slate-500 hover:text-red-400 p-2 rounded-xl hover:bg-slate-800 transition-colors"
                          title="Revoke organizer role"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}

                    {consoleData.organizers.length === 0 && (
                      <div className="col-span-full py-12 text-center text-xs text-slate-500 font-mono rounded-2xl border border-dashed border-slate-800">
                        No organizers currently appointed for this community. Click &quot;Appoint Organizer&quot; to assign a student.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTER CAMPUS                                                    */}
      {/* ========================================================================= */}
      {showAddCampusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="size-5 text-emerald-400" /> Register University Campus
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCampusModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterCampus} className="mt-5 space-y-4">
              {campusModalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  {campusModalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Campus / University Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. BITS Pilani, IIT Jammu, NIT Srinagar"
                  value={newCampusName}
                  onChange={(e) => setNewCampusName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                  required
                />
                <p className="text-[11px] text-emerald-400/90 mt-2 flex items-start gap-1.5 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <Shield className="size-3.5 shrink-0 text-emerald-400 mt-0.5" />
                  <span>
                    A dedicated <strong className="text-white">hackerrankcampuscrew</strong> chapter will automatically be initialized for this campus, and the first registered member will be appointed as the organizer.
                  </span>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddCampusModal(false)}
                  disabled={registeringCampus}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={registeringCampus}
                  className="text-xs flex items-center gap-2"
                >
                  {registeringCampus && <Loader2 className="size-3.5 animate-spin" />}
                  Register Campus
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT CLUB                                                 */}
      {/* ========================================================================= */}
      {showClubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="size-5 text-emerald-400" />
                {editingClub ? 'Edit Club' : `Add Club to ${clubFormData.college || selectedCampus}`}
              </h3>
              <button
                type="button"
                onClick={() => setShowClubModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleClubFormSubmit} className="mt-5 space-y-4">
              {clubFormError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  {clubFormError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">
                    Club Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ACM Chapter"
                    value={clubFormData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setClubFormData((prev) => ({
                        ...prev,
                        name,
                        slug: prev.slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">
                    Slug / URL identifier *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. acm-miet"
                    value={clubFormData.slug}
                    onChange={(e) =>
                      setClubFormData((prev) => ({
                        ...prev,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">
                    Category
                  </label>
                  <select
                    value={clubFormData.category}
                    onChange={(e) =>
                      setClubFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Coding & DSA">Coding & DSA</option>
                    <option value="AI & Robotics">AI & Robotics</option>
                    <option value="Design & Media">Design & Media</option>
                    <option value="Cultural">Cultural</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">
                    Campus Affiliation
                  </label>
                  <input
                    type="text"
                    value={clubFormData.college}
                    onChange={(e) =>
                      setClubFormData((prev) => ({ ...prev, college: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Focus areas, mission, and activities of this club..."
                  value={clubFormData.description}
                  onChange={(e) =>
                    setClubFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="club-is-active"
                  checked={clubFormData.is_active}
                  onChange={(e) =>
                    setClubFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                  }
                  className="size-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="club-is-active" className="text-xs text-slate-300">
                  Active (visible in public directory and student event scoping)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                {editingClub ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setDeletingClub(editingClub);
                      setDeleteClubError('');
                    }}
                    disabled={clubSubmitting}
                    className="text-xs text-red-400 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10"
                  >
                    <Trash2 className="size-3.5 mr-1" /> Delete Club
                  </Button>
                ) : <div />}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowClubModal(false)}
                    disabled={clubSubmitting}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={clubSubmitting}
                    className="text-xs flex items-center gap-2"
                  >
                    {clubSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                    {editingClub ? 'Update Club' : 'Create Club'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPOINT STUDENT AS CLUB ORGANIZER                                  */}
      {/* ========================================================================= */}
      {appointModalClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="size-5 text-emerald-400" /> Appoint Club Organizer
              </h3>
              <button
                type="button"
                onClick={() => setAppointModalClub(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAppointSubmit} className="mt-5 space-y-4">
              <p className="text-xs text-slate-400">
                Granting student organizer permissions for{' '}
                <span className="font-semibold text-white">{appointModalClub.name}</span> (
                {appointModalClub.college || selectedCampus || 'MIET'}).
              </p>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Select Student Candidate *
                </label>

                {loadingCandidates ? (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-mono">
                    <Loader2 className="size-4 animate-spin inline mr-2" /> Loading student profiles...
                  </div>
                ) : candidates.length > 0 ? (
                  <select
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  >
                    <option value="">-- Choose eligible student --</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name || 'Student'} ({c.email}) {c.branch ? `• ${c.branch}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                    No eligible students found registered under {appointModalClub.college || selectedCampus || 'this campus'}. Only students from this same campus can be appointed as organizers.
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAppointModalClub(null)}
                  disabled={appointSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={appointSubmitting || !selectedCandidateId}
                  className="text-xs flex items-center gap-2"
                >
                  {appointSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                  Appoint as Organizer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Campus Confirmation Modal */}
      {deletingCampus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-red-400">
                <div className="size-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Campus</h3>
                  <span className="text-[11px] font-mono text-slate-400">Reassigning to MIET</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingCampus(null)}
                disabled={isDeletingCampus}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded">{deletingCampus}</span>?
              </p>

              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2 text-xs text-red-200">
                <p className="font-semibold text-red-300">Cascading Automatic Actions:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  <li><strong className="text-white">Students</strong> of this campus will be redirected to <strong className="text-emerald-400">MIET</strong>.</li>
                  <li><strong className="text-white">Organizers</strong> will have their privileges revoked and become <strong className="text-emerald-400">students of MIET</strong>.</li>
                  <li><strong className="text-white">Clubs</strong> under this campus will be removed.</li>
                </ul>
              </div>

              {deleteCampusError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  {deleteCampusError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDeletingCampus(null)}
                  disabled={isDeletingCampus}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteCampusSubmit}
                  disabled={isDeletingCampus}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-2 border border-red-500/30"
                >
                  {isDeletingCampus && <Loader2 className="size-3.5 animate-spin" />}
                  Delete Campus & Reassign All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Club Confirmation Modal */}
      {deletingClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-red-400">
                <div className="size-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Club / Community</h3>
                  <span className="text-[11px] font-mono text-slate-400">Reverting Organizers</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingClub(null)}
                disabled={isDeletingClub}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                Are you sure you want to delete club <span className="font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded">{deletingClub.name}</span>?
              </p>

              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 text-xs text-amber-200">
                <p className="font-semibold text-amber-300">Organizer & Event Impact:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  <li><strong className="text-white">All organizers</strong> of this club will have their organizer status removed and will revert to <strong className="text-emerald-400">students</strong>.</li>
                  <li>No organizers will be left holding orphaned roles.</li>
                  <li>Club events will be unlinked.</li>
                </ul>
              </div>

              {deleteClubError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  {deleteClubError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDeletingClub(null)}
                  disabled={isDeletingClub}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteClubSubmit}
                  disabled={isDeletingClub}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-2 border border-red-500/30"
                >
                  {isDeletingClub && <Loader2 className="size-3.5 animate-spin" />}
                  Delete Club & Revert Organizers
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCampusesPage() {
  return (
    <Suspense fallback={<CampusCoderLoader text="Loading Campuses..." />}>
      <AdminCampusesPageContent />
    </Suspense>
  );
}
