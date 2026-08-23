'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';
import {
  ArrowLeft,
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  X,
  Mail,
  School,
  GraduationCap,
  MessageSquare,
  UserCheck,
  Edit,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { deleteStudent } from '@/app/actions/adminActions';

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  college: string | null;
  branch: string | null;
  year: string | null;
  created_at: string;
};
type RegistrationRow = {
  full_name: string | null;
  email: string | null;
  event_id: string;
  attendance_status: string;
  registered_at: string;
  events: Pick<{ title: string }, 'title'> | null;
};
type EventRow = { title: string };

type StudentWithStats = ProfileRow & {
  registrationCount: number;
  attendedCount: number;
  lastActive: string | null;
  events: Pick<EventRow, 'title'>[];
};

export default function AdminStudentsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDbOffline, setIsDbOffline] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch students from backend
  const loadStudentsData = useCallback(async () => {
    try {
      const [data, me] = await Promise.all([
        api<{ ok: boolean; profiles: ProfileRow[]; registrations: RegistrationRow[] }>('/admin/students'),
        api<{ ok: boolean; user: { id: string } }>('/auth/me').catch(() => ({ ok: false, user: { id: '' } })),
      ]);

      if (me.user?.id) {
        setCurrentUserId(me.user.id);
      }

      // Calculate stats per student
      const studentsWithStats: StudentWithStats[] = (data.profiles || []).map((profile) => {
        const studentRegs = (data.registrations || []).filter((r) => r.email === profile.email);
        const attended = studentRegs.filter((r) => r.attendance_status === 'attended').length;
        const lastReg = studentRegs.sort(
          (a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()
        )[0];
        const events = studentRegs.map((r) => r.events?.title).filter(Boolean) as string[];

        return {
          ...profile,
          registrationCount: studentRegs.length,
          attendedCount: attended,
          lastActive: lastReg?.registered_at || null,
          events: events.map((title) => ({ title })) as Pick<EventRow, 'title'>[],
        };
      });

      setStudents(studentsWithStats);
      setIsDbOffline(false);
    } catch (err) {
      console.warn('Database offline, using mock student data:', err);
      setIsDbOffline(true);

      setStudents([
        {
          id: '1',
          full_name: 'Aman Sharma',
          email: 'aman.sharma@college.edu',
          role: 'student',
          college: 'Delhi Engineering College',
          branch: 'Computer Science',
          year: '2027',
          created_at: '2026-01-15T10:00:00Z',
          registrationCount: 5,
          attendedCount: 4,
          lastActive: '2026-05-28T10:00:00Z',
          events: [{ title: 'React Workshop' }, { title: 'DSA Masterclass' }, { title: 'Coding Sprint' }],
        },
        {
          id: '2',
          full_name: 'Priya Iyer',
          email: 'priya.iyer@college.edu',
          role: 'student',
          college: 'Mumbai Institute of Tech',
          branch: 'Information Tech',
          year: '2026',
          created_at: '2026-02-20T10:00:00Z',
          registrationCount: 8,
          attendedCount: 7,
          lastActive: '2026-05-28T08:30:00Z',
          events: [{ title: 'React Workshop' }, { title: 'Cracking Interview' }, { title: 'System Design' }],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStudentsData();
  }, [loadStudentsData]);

  // Update student role
  const handleUpdateRole = async (studentId: string, newRole: 'student' | 'admin' | 'organizer') => {
    try {
      await api(`/admin/students/${studentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });

      setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, role: newRole } : s)));

      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent({ ...selectedStudent, role: newRole });
      }
      setFeedbackMsg({ type: 'success', text: `Role updated to ${newRole}` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to update role: ' + getErrorMessage(err) });
    }
  };

  // Delete student permanently
  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);

    try {
      await deleteStudent(studentToDelete.id);

      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
      if (selectedStudent?.id === studentToDelete.id) {
        setSelectedStudent(null);
      }
      setFeedbackMsg({
        type: 'success',
        text: `Account for "${studentToDelete.full_name || studentToDelete.email}" was permanently deleted.`,
      });
      setStudentToDelete(null);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to delete account: ' + getErrorMessage(err) });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filters logic
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.college?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === '' || student.role === roleFilter;
    const matchesStatus =
      statusFilter === '' ||
      (statusFilter === 'active' && student.registrationCount > 0) ||
      (statusFilter === 'inactive' && student.registrationCount === 0);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Export students as CSV
  const handleExportCSV = useCallback(() => {
    if (filteredStudents.length === 0) {
      alert('No students available to export.');
      return;
    }

    const headers = [
      'Full Name',
      'Email',
      'Role',
      'College',
      'Branch',
      'Year',
      'Total Registrations',
      'Attended',
      'Last Active',
      'Joined Date',
    ];

    const rows = filteredStudents.map((student) => [
      student.full_name,
      student.email,
      student.role,
      student.college || '',
      student.branch || '',
      student.year || '',
      student.registrationCount.toString(),
      student.attendedCount.toString(),
      student.lastActive ? new Date(student.lastActive).toLocaleString() : 'Never',
      new Date(student.created_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `campuscoder_students_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredStudents]);

  // Calculate statistics
  const totalStudents = students.filter((s) => s.role === 'student').length;
  const activeStudents = students.filter((s) => s.role === 'student' && s.registrationCount > 0).length;
  const adminsCount = students.filter((s) => s.role === 'admin').length;
  const organizersCount = students.filter((s) => s.role === 'organizer').length;
  const totalRegistrations = students.reduce((sum, s) => sum + s.registrationCount, 0);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-1">
          <Skeleton variant="text" className="h-3 w-32" />
          <Skeleton variant="text" className="h-8 w-72" />
          <Skeleton variant="text" className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="card" className="h-24" />
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
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group"
          >
            <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Console
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">
            User & Student <span className="text-emerald-500">Accounts</span>
          </h1>
          <p className="text-sm text-slate-400">View, edit, promote, and delete student or staff accounts.</p>
        </div>
        <div>
          <Button variant="primary" onClick={handleExportCSV} className="flex items-center gap-1.5 w-full sm:w-auto">
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="size-4 shrink-0 text-red-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Database Warning */}
      {isDbOffline && (
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-emerald-500/10 rounded-xl text-xs text-slate-400 font-mono">
          <span className="size-4 text-amber-500 flex-shrink-0">⚠</span>
          <span>Local Demo Mode: Database offline, displaying mock records.</span>
        </div>
      )}

      {/* Metrics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4">
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Total Students</p>
          <p className="text-2xl font-mono font-bold text-white mt-1">{totalStudents}</p>
        </Card>
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4">
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">
            Active (RSVP&apos;d)
          </p>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">{activeStudents}</p>
        </Card>
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4">
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Admins</p>
          <p className="text-2xl font-mono font-bold text-cyan-400 mt-1">{adminsCount}</p>
        </Card>
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4">
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Organizers</p>
          <p className="text-2xl font-mono font-bold text-purple-400 mt-1">{organizersCount}</p>
        </Card>
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4">
          <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">Total RSVPs</p>
          <p className="text-2xl font-mono font-bold text-amber-400 mt-1">{totalRegistrations}</p>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            aria-label="Search name, email, college"
            type="text"
            placeholder="Search name, email, college&hellip;"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <select
            value={roleFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
            <option value="organizer">Organizers</option>
          </select>
        </div>
        <div className="relative">
          <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
          >
            <option value="">All Status</option>
            <option value="active">Active (Has RSVPs)</option>
            <option value="inactive">Inactive (No RSVPs)</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      {filteredStudents.length > 0 ? (
        <Card hoverEffect={false} className="border-slate-900 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/60 font-mono text-xs text-slate-500 uppercase tracking-widest">
                  <th className="py-4 px-6 font-semibold">User</th>
                  <th className="py-4 px-6 font-semibold">Role</th>
                  <th className="py-4 px-6 font-semibold">Campus</th>
                  <th className="py-4 px-6 font-semibold">Activity</th>
                  <th className="py-4 px-6 font-semibold">Joined Date</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-sm text-slate-300">
                {filteredStudents.map((student) => {
                  const isSelf = currentUserId === student.id;
                  return (
                    <tr key={student.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{student.full_name || 'Unnamed User'}</span>
                          {isSelf && (
                            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Mail className="size-3" /> {student.email}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          variant={
                            student.role === 'admin'
                              ? 'accent'
                              : student.role === 'organizer'
                              ? 'success'
                              : 'default'
                          }
                          className="text-[10px] font-medium capitalize"
                        >
                          {student.role}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-200 truncate max-w-xs">{student.college || '—'}</div>
                        {student.branch && (
                          <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                            {student.branch} • Year {student.year}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-400">
                            {student.registrationCount} RSVPs
                          </span>
                          {student.attendedCount > 0 && (
                            <span className="text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400">
                              {student.attendedCount} Attended
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedStudent(student)}
                            className="text-slate-500 hover:text-emerald-400 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="size-4" />
                          </button>
                          <Link
                            href={`/admin/students/${student.id}`}
                            className="text-slate-500 hover:text-cyan-400 p-1.5 rounded hover:bg-slate-900 transition-colors"
                            title="Edit Profile"
                          >
                            <Edit className="size-4" />
                          </Link>
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => setStudentToDelete(student)}
                              className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                              title="Delete Account Permanently"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-12 bg-slate-900/10 border border-slate-900 rounded-xl">
          <Users className="size-12 text-slate-800 mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-500">No accounts found matching the search criteria.</p>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white font-mono">{selectedStudent.full_name || 'User Profile'}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Account & Registration Activity</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-lg border border-slate-900">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Mail className="size-3" /> Email
                  </p>
                  <p className="text-xs text-white break-all font-mono">{selectedStudent.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Role</p>
                  <select
                    value={selectedStudent.role}
                    onChange={(e) => handleUpdateRole(selectedStudent.id, e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                    <option value="organizer">Organizer</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <School className="size-3" /> College
                  </p>
                  <p className="text-xs text-white font-semibold truncate">
                    {selectedStudent.college || 'Not specified'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <GraduationCap className="size-3" /> Branch / Year
                  </p>
                  <p className="text-xs text-white font-mono">
                    {selectedStudent.branch || 'Not specified'} • {selectedStudent.year || 'Not specified'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Member Since</p>
                  <p className="text-xs text-white font-mono">
                    {new Date(selectedStudent.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Last Active</p>
                  <p className="text-xs text-white font-mono">
                    {selectedStudent.lastActive ? new Date(selectedStudent.lastActive).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4 text-center">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total RSVPs</p>
                  <p className="text-3xl font-bold text-white font-mono mt-1">{selectedStudent.registrationCount}</p>
                </Card>
                <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4 text-center">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Attended</p>
                  <p className="text-3xl font-bold text-emerald-400 font-mono mt-1">{selectedStudent.attendedCount}</p>
                </Card>
                <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-4 text-center">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Attendance Rate</p>
                  <p className="text-3xl font-bold text-cyan-400 font-mono mt-1">
                    {selectedStudent.registrationCount > 0
                      ? Math.round((selectedStudent.attendedCount / selectedStudent.registrationCount) * 100) + '%'
                      : 'N/A'}
                  </p>
                </Card>
              </div>

              {/* Events Attended */}
              {selectedStudent.events.length > 0 && (
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-900 space-y-2">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <MessageSquare className="size-3" /> Events Registered
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.events.map((ev, i) => (
                      <Badge key={i} variant="default" className="text-[10px]">
                        {ev.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              {currentUserId !== selectedStudent.id && (
                <div className="pt-4 border-t border-slate-900/60">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">Danger Zone</p>
                  <Button
                    variant="outline"
                    className="w-full border-red-950/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 flex items-center justify-center gap-1.5"
                    onClick={() => {
                      setStudentToDelete(selectedStudent);
                    }}
                  >
                    <Trash2 className="size-4" /> Delete Account Permanently
                  </Button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
              <Link
                href={`/admin/students/${selectedStudent.id}`}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono inline-flex items-center gap-1"
                onClick={() => setSelectedStudent(null)}
              >
                Open full profile →
              </Link>
              <Button variant="secondary" onClick={() => setSelectedStudent(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-950 border border-red-500/30 rounded-xl shadow-2xl p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-mono">Delete Account Permanently</h3>
                <p className="text-xs text-slate-400">
                  This action cannot be undone and will permanently remove this user from the system.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="text-white font-bold">{studentToDelete.full_name || 'Unnamed'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-emerald-400">{studentToDelete.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="text-slate-200 capitalize">{studentToDelete.role}</span>
              </div>
              {studentToDelete.registrationCount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Linked RSVPs:</span>
                  <span>{studentToDelete.registrationCount} event registration(s)</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-red-400/90 leading-relaxed font-mono">
              ⚠ Deleting this account will remove their database profile, auth login credentials, and all event registrations.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                disabled={isDeleting}
                onClick={() => setStudentToDelete(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-500 border-red-500 text-white text-xs flex items-center gap-1.5 shadow-lg shadow-red-500/20"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" /> Delete Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}