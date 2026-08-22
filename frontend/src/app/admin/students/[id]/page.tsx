'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Edit, Mail, School, GraduationCap, Shield, Trash2,
  Calendar, Users, AlertTriangle, CheckCircle2, BookOpen, MessageSquare
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { updateStudent, deleteStudent } from '@/app/actions/adminActions';
import { getErrorMessage } from '@/lib/errors';
import StudentForm, { type StudentProfileData } from '../StudentForm';
import { toast } from 'sonner';

interface PageProps {
  params: Promise<{ id: string }>;
}

type RegistrationRow = {
  id: string;
  full_name: string;
  email: string;
  event_id: string;
  attendance_status: string;
  registered_at: string;
  events: { title: string } | null;
};

export default function AdminStudentDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load the student + their registrations + the signed-in admin's id
  useEffect(() => {
    const load = async () => {
      try {
        const [data, me] = await Promise.all([
          api<{ ok: boolean; profile: StudentProfileData; registrations: RegistrationRow[] }>(`/admin/students/${id}`),
          api<{ ok: boolean; user: { id: string } }>('/auth/me'),
        ]);
        setProfile(data.profile);
        setRegistrations(data.registrations || []);
        setCurrentUserId(me.user?.id || null);
      } catch (err) {
        setErrorMsg('Failed to load student: ' + getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (id) void load();
  }, [id]);

  const handleSave = async (payload: {
    full_name: string;
    college: string | null;
    branch: string | null;
    year: string | null;
    role: 'student' | 'admin' | 'organizer';
  }) => {
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await updateStudent(id, payload);
      setProfile((prev) => (prev ? { ...prev, ...payload } : prev));
      setSuccessMsg('Profile saved successfully.');
      toast.success('Profile updated');
    } catch (err) {
      const msg = 'Failed to save profile: ' + getErrorMessage(err);
      setErrorMsg(msg);
      toast.error(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!profile) return;
    if (!confirm(`Delete ${profile.full_name || profile.email}? This cannot be undone.`)) return;
    try {
      await deleteStudent(id);
      toast.success('Student deleted');
      router.push('/admin/students');
      router.refresh();
    } catch (err) {
      const msg = 'Failed to delete: ' + getErrorMessage(err);
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-4xl">
        <div className="space-y-1">
          <Skeleton variant="text" className="h-3 w-32" />
          <Skeleton variant="text" className="h-8 w-72" />
          <Skeleton variant="text" className="h-4 w-64" />
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50">
          <SkeletonTable rows={4} cols={3} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Link href="/admin/students" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono">
          <ArrowLeft className="size-3" /> Back to Students
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2 font-mono">
          <AlertTriangle className="size-4" /> {errorMsg || 'Student not found.'}
        </div>
      </div>
    );
  }

  const isSelf = currentUserId === profile.id;
  const attendedCount = registrations.filter((r) => r.attendance_status === 'attended').length;
  const attendanceRate =
    registrations.length > 0 ? Math.round((attendedCount / registrations.length) * 100) : null;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="space-y-1">
        <Link href="/admin/students" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
          <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Students
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
            {(profile.full_name || profile.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
              <Edit className="size-7 text-emerald-500" /> {profile.full_name || 'Unnamed Student'}
            </h1>
            <p className="text-sm text-slate-400 flex items-center gap-2 flex-wrap mt-1">
              <span className="flex items-center gap-1"><Mail className="size-3.5" /> {profile.email}</span>
              <Badge
                variant={profile.role === 'admin' ? 'accent' : profile.role === 'organizer' ? 'success' : 'default'}
                className="text-[10px] capitalize"
              >
                {profile.role}
              </Badge>
              {isSelf && (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                  This is you
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-mono">
          <CheckCircle2 className="size-4" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-mono">
          <AlertTriangle className="size-4" /> {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Edit form (left, wider) */}
        <div className="lg:col-span-2">
          <StudentForm
            initialData={profile}
            isSelf={isSelf}
            onSubmit={handleSave}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Side panel: snapshot + danger zone */}
        <div className="space-y-6">
          <Card className="border-slate-800 bg-slate-950/40 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest text-slate-400">
              Account Snapshot
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="text-slate-500 flex items-center gap-1.5"><Mail className="size-3" /> Email</span>
                <span className="font-mono text-white truncate ml-3 max-w-[180px]">{profile.email || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="text-slate-500 flex items-center gap-1.5"><Shield className="size-3" /> Role</span>
                <span className="font-mono text-white capitalize">{profile.role}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="text-slate-500 flex items-center gap-1.5"><School className="size-3" /> College</span>
                <span className="font-mono text-white truncate ml-3 max-w-[180px]">{profile.college || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="text-slate-500 flex items-center gap-1.5"><GraduationCap className="size-3" /> Branch</span>
                <span className="font-mono text-white truncate ml-3 max-w-[180px]">{profile.branch || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="text-slate-500 flex items-center gap-1.5"><GraduationCap className="size-3" /> Year</span>
                <span className="font-mono text-white">{profile.year || '—'}</span>
              </div>
              {profile.created_at && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="size-3" /> Joined</span>
                  <span className="font-mono text-slate-300">{new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Activity stats */}
          <Card className="border-slate-800 bg-slate-950/40 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest text-slate-400">
              Activity
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">RSVPs</p>
                <p className="text-xl font-bold text-white font-mono mt-1">{registrations.length}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Attended</p>
                <p className="text-xl font-bold text-emerald-400 font-mono mt-1">{attendedCount}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Rate</p>
                <p className="text-xl font-bold text-cyan-400 font-mono mt-1">
                  {attendanceRate !== null ? `${attendanceRate}%` : '—'}
                </p>
              </div>
            </div>
          </Card>

          {/* Danger zone */}
          <Card className="border-red-950/40 bg-red-950/5 p-6 space-y-3">
            <h3 className="text-sm font-bold text-red-400 font-mono uppercase tracking-widest">
              Danger Zone
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Permanently delete this student&apos;s profile. This cannot be undone.
            </p>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="w-full border-red-950/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="size-4" /> Delete Profile
            </Button>
          </Card>
        </div>
      </div>

      {/* Event registrations list */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
          <BookOpen className="size-5 text-emerald-400" /> Event Registrations ({registrations.length})
        </h2>

        {registrations.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/50 border border-slate-900 rounded-xl">
            <Users className="size-10 text-slate-800 mx-auto mb-3" />
            <p className="text-sm font-mono text-slate-500">No event registrations found.</p>
          </div>
        ) : (
          <Card hoverEffect={false} className="border-slate-900 p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/60 font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                    <th className="py-3 px-6 font-semibold">Event</th>
                    <th className="py-3 px-6 font-semibold">Registered</th>
                    <th className="py-3 px-6 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="size-3 text-slate-500" />
                          <span className="font-semibold text-white">{reg.events?.title || 'Unknown event'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 font-mono text-slate-400">
                        {new Date(reg.registered_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-6">
                        <Badge
                          variant={
                            reg.attendance_status === 'attended'
                              ? 'success'
                              : reg.attendance_status === 'absent'
                              ? 'error'
                              : 'default'
                          }
                          className="text-[10px] capitalize"
                        >
                          {reg.attendance_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
