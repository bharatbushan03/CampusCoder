'use client';

import React, { useState, useEffect, use } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, Calendar, CheckCircle2, AlertTriangle, Loader2, Search, 
  Download, Eye, Trash2, X, ArrowLeft, Mail, Phone, 
  School, GraduationCap, Code2, MessageSquare, Clock
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SingleEventRegistrationsPage({ params }: PageProps) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState('');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isDbOffline, setIsDbOffline] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected registration for details modal
  const [selectedReg, setSelectedReg] = useState<any | null>(null);

  // Fetch registrations & event info
  const loadRegistrationsData = async () => {
    try {
      const supabase = createClient() as any;

      // Fetch event details
      const { data: eventData } = await supabase
        .from('events')
        .select('title')
        .eq('id', id)
        .single();

      if (eventData) {
        setEventTitle(eventData.title);
      }

      // Fetch registrations for this event
      const { data: regsData, error } = await supabase
        .from('registrations')
        .select('*, events(title)')
        .eq('event_id', id)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      setRegistrations(regsData || []);
      setIsDbOffline(false);
    } catch (err: any) {
      console.warn('Database offline, using mock registrations data for event:', err);
      setIsDbOffline(true);
      setEventTitle('Hands-on React & Next.js Workshop');
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
          event_id: id, 
          events: { title: 'Hands-on React & Next.js Workshop' } 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrationsData();
  }, [id]);

  // Update attendance status
  const handleUpdateAttendance = async (regId: string, newStatus: 'registered' | 'attended' | 'absent') => {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('registrations')
        .update({ attendance_status: newStatus })
        .eq('id', regId);

      if (error) throw error;

      // Update local state list
      setRegistrations(prev =>
        prev.map(reg => reg.id === regId ? { ...reg, attendance_status: newStatus } : reg)
      );

      // If active in details modal, update details view too
      if (selectedReg && selectedReg.id === regId) {
        setSelectedReg({ ...selectedReg, attendance_status: newStatus });
      }
    } catch (err: any) {
      alert('Failed to update attendance status: ' + err.message);
    }
  };

  // Delete registration record
  const handleDeleteRegistration = async (regId: string) => {
    if (!confirm('Are you sure you want to delete this registration? This action is irreversible.')) return;

    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', regId);

      if (error) throw error;

      // Update local state list
      setRegistrations(prev => prev.filter(reg => reg.id !== regId));
      setSelectedReg(null);
    } catch (err: any) {
      alert('Failed to delete registration: ' + err.message);
    }
  };

  // Export registrations as CSV
  const handleExportCSV = () => {
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
      reg.events?.title || eventTitle,
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
    link.setAttribute('download', `${eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_registrations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters logic
  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch = 
      reg.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.college?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.branch?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === '' || reg.attendance_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats for metrics panel
  const totalCount = filteredRegistrations.length;
  const attendedCount = filteredRegistrations.filter(r => r.attendance_status === 'attended').length;
  const absentCount = filteredRegistrations.filter(r => r.attendance_status === 'absent').length;
  const registeredOnlyCount = filteredRegistrations.filter(r => r.attendance_status === 'registered').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[calc(100vh-10rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-400">Loading registrations ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin/events" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Sprints
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono">{eventTitle}</h1>
          <p className="text-sm text-slate-400">Audit RSVPs and update attendance for this sprint session.</p>
        </div>
        <div>
          <Button 
            variant="primary" 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Database Warning */}
      {isDbOffline && (
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-emerald-500/10 rounded-xl text-xs text-slate-400 font-mono">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>Local Demo Mode: Running on mock data.</span>
        </div>
      )}

      {/* Metrics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total registrations matching filters */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4">
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Event Registrations</p>
          <p className="text-2xl font-mono font-bold text-white mt-1">{totalCount}</p>
        </Card>

        {/* Registered Only */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4">
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500 font-semibold text-cyan-400">Registered</p>
          <p className="text-2xl font-mono font-bold text-cyan-400 mt-1">{registeredOnlyCount}</p>
        </Card>

        {/* Attended */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4">
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500 font-semibold text-emerald-400">Attended</p>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">{attendedCount}</p>
        </Card>

        {/* Absent */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4">
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500 font-semibold text-red-400">Absent</p>
          <p className="text-2xl font-mono font-bold text-red-400 mt-1">{absentCount}</p>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search student name, email, college, branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Filter Status */}
        <div className="relative">
          <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
                        <Mail className="h-3 w-3" /> {reg.email}
                      </div>
                      {reg.phone && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="h-3 w-3" /> {reg.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-200 truncate max-w-xs">{reg.college}</div>
                      <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{reg.branch} • Year {reg.year}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">Lvl: {reg.coding_level || 'Not Specified'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={reg.attendance_status}
                        onChange={(e) => handleUpdateAttendance(reg.id, e.target.value as any)}
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
                        <button
                          onClick={() => setSelectedReg(reg)}
                          className="text-slate-500 hover:text-emerald-400 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                          title="View Registration Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRegistration(reg.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                          title="Delete Registration"
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
              <button 
                onClick={() => setSelectedReg(null)}
                className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-sm text-slate-300">
              
              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-3 rounded-lg border border-slate-900">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </p>
                  <p className="text-xs text-white break-all font-mono">{selectedReg.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Contact Phone
                  </p>
                  <p className="text-xs text-white font-mono">{selectedReg.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Education Info */}
              <div className="grid grid-cols-3 gap-4 bg-slate-950/50 p-3 rounded-lg border border-slate-900">
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <School className="h-3 w-3" /> College
                  </p>
                  <p className="text-xs text-white font-semibold truncate">{selectedReg.college}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> Batch/Year
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
                    <Code2 className="h-3 w-3" /> Coding Level
                  </p>
                  <span className="inline-block text-xs text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-medium">
                    {selectedReg.coding_level || 'Not Specified'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Code2 className="h-3 w-3" /> Language
                  </p>
                  <span className="inline-block text-xs text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono">
                    {selectedReg.preferred_language || 'Not Specified'}
                  </span>
                </div>
              </div>

              {/* Event RSVP details */}
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-900 space-y-2">
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> RSVP Event Title
                  </p>
                  <p className="text-xs text-white font-bold mt-0.5">{eventTitle}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-900/60">
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Registration Date
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {new Date(selectedReg.registered_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Attendance Status</p>
                    <select
                      value={selectedReg.attendance_status}
                      onChange={(e) => handleUpdateAttendance(selectedReg.id, e.target.value as any)}
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

              {/* Motivation */}
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-900 space-y-1">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Motivation Statement
                </p>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{selectedReg.reason_to_join || 'No statement provided.'}"
                </p>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-900">
              <Button
                variant="outline"
                className="border-red-950/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 flex items-center gap-1.5"
                onClick={() => handleDeleteRegistration(selectedReg.id)}
              >
                <Trash2 className="h-4 w-4" /> Delete Registration
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
