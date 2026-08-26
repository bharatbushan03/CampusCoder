'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Calendar, CheckCircle2, AlertTriangle, Search, 
  Filter, Download, Eye, Trash2, X, ArrowLeft, Mail, Phone, 
  School, GraduationCap, Code2, MessageSquare, Clock
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';

type EventRow = {
  id: string;
  title: string;
};
type RegistrationRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  college: string | null;
  branch: string | null;
  year: string | null;
  coding_level: string | null;
  preferred_language: string | null;
  reason_to_join: string | null;
  registered_at: string;
  attendance_status: string;
  event_id: string;
};
type AttendanceStatus = 'registered' | 'attended' | 'absent';
type RegistrationType = RegistrationRow & {
  events: Pick<EventRow, 'title'> | null;
};
type EventFilterOption = Pick<EventRow, 'id' | 'title'>;

export default function AdminRegistrationsPage() {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<RegistrationType[]>([]);
  const [events, setEvents] = useState<EventFilterOption[]>([]);
  const [isDbOffline, setIsDbOffline] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [eventFilter, setEventFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | ''>('');

  // Selected registration for details modal
  const [selectedReg, setSelectedReg] = useState<RegistrationType | null>(null);

  // Fetch registrations & events from backend
  const loadRegistrationsData = async () => {
    try {
      const [eventsData, regsData] = await Promise.all([
        api<{ ok: boolean; events: EventFilterOption[] }>('/admin/events/options'),
        api<{ ok: boolean; registrations: RegistrationType[] }>('/admin/registrations'),
      ]);

      if (eventsData.events) setEvents(eventsData.events);
      setRegistrations(regsData.registrations || []);
      setIsDbOffline(false);
    } catch (err) {
      console.warn('Database offline, using mock registrations data:', err);
      setIsDbOffline(true);
      
      setEvents([
        { id: '1', title: 'Hands-on React & Next.js Workshop' },
        { id: '2', title: 'Cracking the Coding Interview: AMA' },
        { id: '3', title: 'Weekly Coding Sprint: HackerRank practice' }
      ]);

      setRegistrations([
        { 
          id: 'reg-1', 
          full_name: 'Aman Sharma', 
          email: 'aman.sharma@college.edu', 
          phone: '+91 9876543210', 
          college: 'Delhi Engineering College', 
          branch: 'Computer Science', 
          year: '2027', 
          coding_level: 'Intermediate', 
          preferred_language: 'JavaScript',
          reason_to_join: 'I want to build real-world experience in React and Next.js framework.',
          registered_at: '2026-05-28T10:00:00Z', 
          attendance_status: 'registered', 
          event_id: '1', 
          events: { title: 'Hands-on React & Next.js Workshop' } 
        },
        { 
          id: 'reg-2', 
          full_name: 'Priya Iyer', 
          email: 'priya.iyer@college.edu', 
          phone: '+91 9123456789', 
          college: 'Mumbai Institute of Tech', 
          branch: 'Information Tech', 
          year: '2026', 
          coding_level: 'Advanced', 
          preferred_language: 'C++',
          reason_to_join: 'I want to review data structures and prepare for product company interviews.',
          registered_at: '2026-05-28T08:30:00Z', 
          attendance_status: 'attended', 
          event_id: '2', 
          events: { title: 'Cracking the Coding Interview: AMA' } 
        },
        { 
          id: 'reg-3', 
          full_name: 'Kabir Verma', 
          email: 'kabir.v@college.edu', 
          phone: '+91 9998887776', 
          college: 'Delhi Engineering College', 
          branch: 'Software Engineering', 
          year: '2028', 
          coding_level: 'Beginner', 
          preferred_language: 'Python',
          reason_to_join: 'I am starting my coding journey and looking for guidance on solving practice problems.',
          registered_at: '2026-05-27T14:15:00Z', 
          attendance_status: 'absent', 
          event_id: '3', 
          events: { title: 'Weekly Coding Sprint: HackerRank practice' } 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     
    void loadRegistrationsData();
  }, []);

  // Update attendance status
  const handleUpdateAttendance = async (regId: string, newStatus: AttendanceStatus) => {
    try {
      await api(`/admin/registrations/${regId}/attendance`, {
        method: 'PATCH',
        body: JSON.stringify({ attendance_status: newStatus }),
      });

      // Update local state list
      setRegistrations(prev =>
        prev.map(reg => reg.id === regId ? { ...reg, attendance_status: newStatus } : reg)
      );

      // If active in details modal, update details view too
      if (selectedReg && selectedReg.id === regId) {
        setSelectedReg({ ...selectedReg, attendance_status: newStatus });
      }
    } catch (err) {
      alert('Failed to update attendance status: ' + getErrorMessage(err));
    }
  };

  // Delete registration record
  const handleDeleteRegistration = async (regId: string) => {
    if (!confirm('Are you sure you want to delete this registration? This action is irreversible.')) return;

    try {
      await api(`/admin/registrations/${regId}`, { method: 'DELETE' });

      // Update local state list
      setRegistrations(prev => prev.filter(reg => reg.id !== regId));
      setSelectedReg(null);
    } catch (err) {
      alert('Failed to delete registration: ' + getErrorMessage(err));
    }
  };

  // Filters logic
  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch = 
      reg.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.college?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.branch?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEvent = eventFilter === '' || reg.event_id === eventFilter;
    const matchesStatus = statusFilter === '' || reg.attendance_status === statusFilter;

    return matchesSearch && matchesEvent && matchesStatus;
  });

  // Export registrations as CSV
  const handleExportCSV = useCallback(() => {
    if (filteredRegistrations.length === 0) {
      alert('No registrations available to export.');
      return;
    }

    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'College',
      'Branch',
      'Year',
      'Coding Level',
      'Preferred Language',
      'Event Title',
      'Registration Date',
      'Attendance Status'
    ];

    const rows = filteredRegistrations.map((reg) => [
      reg.full_name,
      reg.email,
      reg.phone || '',
      reg.college || '',
      reg.branch || '',
      reg.year || '',
      reg.coding_level || '',
      reg.preferred_language || '',
      reg.events?.title || 'General RSVP',
      new Date(reg.registered_at).toLocaleString(),
      reg.attendance_status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    // Use a timestamp for the filename but move it to the event handler to avoid impurity
    const timestamp = new Date().getTime();
    link.setAttribute('download', `campuscoder_registrations_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredRegistrations]);

  // Calculate live statistics for metrics panel
  const totalCount = filteredRegistrations.length;
  const attendedCount = filteredRegistrations.filter(r => r.attendance_status === 'attended').length;
  const absentCount = filteredRegistrations.filter(r => r.attendance_status === 'absent').length;
  const registeredOnlyCount = filteredRegistrations.filter(r => r.attendance_status === 'registered').length;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-1">
          <Skeleton variant="text" className="h-3 w-32" />
          <Skeleton variant="text" className="h-8 w-72" />
          <Skeleton variant="text" className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 space-y-2">
              <Skeleton variant="text" className="h-3 w-24" />
              <Skeleton variant="text" className="h-6 w-12" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50">
          <SkeletonTable rows={6} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
            <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Console
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">Registrations Ledger</h1>
          <p className="text-sm text-slate-400">Track RSVPs, audit attendance log, and export database files.</p>
        </div>
        <div>
          <Button 
            variant="primary" 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 w-full sm:w-auto"
          >
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Database Warning */}
      {isDbOffline && (
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-emerald-500/10 rounded-xl text-xs text-slate-400 font-mono">
          <AlertTriangle className="size-4 text-amber-500 flex-shrink-0" />
          <span>Local Demo Mode: Run migration scripts to enable full storage exports.</span>
        </div>
      )}

      {/* Metrics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total registrations matching filters */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4">
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Filtered Records</p>
          <p className="text-2xl font-mono font-bold text-white mt-1">{totalCount}</p>
        </Card>

        {/* Registered Only */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4">
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Registered RSVPs</p>
          <p className="text-2xl font-mono font-bold text-cyan-400 mt-1">{registeredOnlyCount}</p>
        </Card>

        {/* Attended */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4">
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500 font-semibold">Attended</p>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">{attendedCount}</p>
        </Card>

        {/* Absent */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4">
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Absent</p>
          <p className="text-2xl font-mono font-bold text-red-400 mt-1">{absentCount}</p>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input aria-label="Search name, email, college, branch"
            type="text"
            placeholder="Search name, email, college, branch&hellip;"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Filter Event */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <select
            value={eventFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEventFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
          >
            <option value="">All Events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="relative">
          <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as AttendanceStatus | '')}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
          >
            <option value="">All Attendance Statuses</option>
            <option value="registered">Registered</option>
            <option value="attended">Attended</option>
            <option value="absent">Absent</option>
          </select>
        </div>
      </div>

      {/* Registrations List */}
      {filteredRegistrations.length > 0 ? (
        <Card hoverEffect={false} className="border-slate-900 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/60 font-mono text-xs text-slate-500">
                  <th className="py-4 px-6 font-semibold">Student Details</th>
                  <th className="py-4 px-6 font-semibold">Campus & Stream</th>
                  <th className="py-4 px-6 font-semibold">Event Target</th>
                  <th className="py-4 px-6 font-semibold">Attendance</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-sm text-slate-300">
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{reg.full_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                        <Mail className="size-3" /> {reg.email}
                      </div>
                      {reg.phone && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="size-3" /> {reg.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-200 truncate max-w-xs">{reg.college}</div>
                      <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{reg.branch} • Year {reg.year}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">Lvl: {reg.coding_level || 'Not Specified'}</div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-200">
                      {reg.events?.title || 'General RSVP'}
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={reg.attendance_status}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateAttendance(reg.id, e.target.value as AttendanceStatus)}
                        className={`bg-slate-950 border text-xs font-mono font-medium rounded px-2.5 py-1 focus:outline-none cursor-pointer capitalize ${
                          reg.attendance_status === 'attended' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                          reg.attendance_status === 'absent' ? 'border-red-500/20 text-red-400 bg-red-500/5' :
                          'border-slate-800 text-slate-300'
                        }`}
                      >
                        <option value="registered">Registered</option>
                        <option value="attended">Attended</option>
                        <option value="absent">Absent</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button"
                          onClick={() => setSelectedReg(reg)}
                          className="text-slate-500 hover:text-emerald-400 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                          title="View Registration Details"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button type="button"
                          onClick={() => handleDeleteRegistration(reg.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                          title="Delete Registration"
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
          <p className="text-sm font-mono text-slate-500">No registrations found in the records.</p>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DETAILS VIEW MODAL */}
      {/* ------------------------------------------------------------- */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-6 md:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white font-mono">{selectedReg.full_name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Registration Audit Details</p>
              </div>
              <button type="button" 
                onClick={() => setSelectedReg(null)}
                className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-sm text-slate-300">
              
              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-3 rounded-lg border border-slate-900">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Mail className="size-3" /> Email
                  </p>
                  <p className="text-xs text-white break-all font-mono">{selectedReg.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Phone className="size-3" /> Contact Phone
                  </p>
                  <p className="text-xs text-white font-mono">{selectedReg.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Education Info */}
              <div className="grid grid-cols-3 gap-4 bg-slate-950/50 p-3 rounded-lg border border-slate-900">
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <School className="size-3" /> College
                  </p>
                  <p className="text-xs text-white font-semibold truncate">{selectedReg.college}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <GraduationCap className="size-3" /> Batch/Year
                  </p>
                  <p className="text-xs text-white font-mono">{selectedReg.year}</p>
                </div>
                <div className="space-y-1 col-span-3 pt-2 border-t border-slate-900/60">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Branch / Stream</p>
                  <p className="text-xs text-white">{selectedReg.branch}</p>
                </div>
              </div>

              {/* Technical Profile */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-3 rounded-lg border border-slate-900">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Code2 className="size-3" /> Coding Level
                  </p>
                  <span className="inline-block text-xs text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-medium">
                    {selectedReg.coding_level || 'Not Specified'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Code2 className="size-3" /> Language
                  </p>
                  <span className="inline-block text-xs text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono">
                    {selectedReg.preferred_language || 'Not Specified'}
                  </span>
                </div>
              </div>

              {/* Event RSVP target details */}
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-900 space-y-2">
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="size-3" /> RSVP Event Title
                  </p>
                  <p className="text-xs text-white font-bold mt-0.5">{selectedReg.events?.title || 'General RSVP'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-900/60">
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="size-3" /> Registration Date
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {new Date(selectedReg.registered_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Attendance Status</p>
                    <select
                      value={selectedReg.attendance_status}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateAttendance(selectedReg.id, e.target.value as AttendanceStatus)}
                      className={`bg-slate-950 border border-slate-800 text-xs font-mono font-medium rounded px-2.5 py-0.5 mt-0.5 cursor-pointer capitalize ${
                        selectedReg.attendance_status === 'attended' ? 'text-emerald-400' :
                        selectedReg.attendance_status === 'absent' ? 'text-red-400' :
                        'text-slate-300'
                      }`}
                    >
                      <option value="registered">Registered</option>
                      <option value="attended">Attended</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Statement of reason */}
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-900 space-y-1">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <MessageSquare className="size-3" /> Motivation Statement
                </p>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  &ldquo;{selectedReg.reason_to_join || 'No statement provided.'}&rdquo;
                </p>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-900">
              <Button
                variant="outline"
                className="border-red-950/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 flex items-center gap-1.5"
                onClick={() => handleDeleteRegistration(selectedReg.id)}
              >
                <Trash2 className="size-4" /> Delete Registration
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedReg(null)}
              >
                Close View
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

