'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Save, User, Mail, School, GraduationCap, Shield, Info } from 'lucide-react';
import { studentUpdateSchema } from '@/lib/validation';
import { toast } from 'sonner';

export type StudentProfileData = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  college: string | null;
  branch: string | null;
  year: string | null;
  created_at?: string;
};

interface StudentFormProps {
  initialData: StudentProfileData;
  /** True when the form is editing the currently-signed-in admin. Used to lock role. */
  isSelf: boolean;
  onSubmit: (data: {
    full_name: string;
    college: string | null;
    branch: string | null;
    year: string | null;
    role: 'student' | 'admin' | 'organizer';
  }) => Promise<void>;
  isSubmitting: boolean;
}

export default function StudentForm({
  initialData,
  isSelf,
  onSubmit,
  isSubmitting,
}: StudentFormProps) {
  const [fullName, setFullName] = useState(initialData.full_name || '');
  const [college, setCollege] = useState(initialData.college || '');
  const [branch, setBranch] = useState(initialData.branch || '');
  const [year, setYear] = useState(initialData.year || '');
  const [role, setRole] = useState<'student' | 'admin' | 'organizer'>(
    (initialData.role as 'student' | 'admin' | 'organizer') || 'student'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      full_name: fullName.trim(),
      college: college.trim() ? college.trim() : null,
      branch: branch.trim() ? branch.trim() : null,
      year: year.trim() ? year.trim() : null,
      role,
    };

    const validation = studentUpdateSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    try {
      await onSubmit(validation.data as {
        full_name: string;
        college: string | null;
        branch: string | null;
        year: string | null;
        role: 'student' | 'admin' | 'organizer';
      });
    } catch (err) {
      // The page handler shows the error toast; just log here.
      console.error('Student form submit failed:', err);
    }
  };

  const isDirty =
    fullName !== (initialData.full_name || '') ||
    college !== (initialData.college || '') ||
    branch !== (initialData.branch || '') ||
    year !== (initialData.year || '') ||
    role !== (initialData.role || 'student');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-slate-900 bg-slate-950/40 p-6 sm:p-8">
        <div className="space-y-6">
          {/* Identity */}
          <div className="space-y-2">
            <label htmlFor="studentform-full-name" className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User className="size-3 text-emerald-400" /> Full Name
            </label>
            <input id="studentform-full-name"
              type="text"
              placeholder="Aman Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
              required
            />
          </div>

          {/* Read-only email — auth email is not editable from the admin console */}
          <div className="space-y-2">
            <label htmlFor="studentform-email" className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Mail className="size-3 text-emerald-400" /> Email
            </label>
            <input id="studentform-email"
              type="email"
              value={initialData.email || ''}
              readOnly
              disabled
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-500 font-mono cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Info className="size-3" /> Email is tied to the auth account and cannot be changed here.
            </p>
          </div>

          {/* Campus info */}
          <div className="space-y-2">
            <label htmlFor="studentform-college" className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <School className="size-3 text-emerald-400" /> College
            </label>
            <input id="studentform-college"
              type="text"
              placeholder="Delhi Engineering College"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="studentform-branch" className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="size-3 text-emerald-400" /> Branch / Stream
              </label>
              <input id="studentform-branch"
                type="text"
                placeholder="Computer Science"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="studentform-year" className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="size-3 text-emerald-400" /> Passing Year / Batch
              </label>
              <input id="studentform-year"
                type="text"
                placeholder="2027"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label htmlFor="studentform-role" className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="size-3 text-emerald-400" /> Role
            </label>
            <select id="studentform-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'student' | 'admin' | 'organizer')}
              disabled={isSelf}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="student">Student</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>
            {isSelf && (
              <p className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                <Info className="size-3" /> You cannot change your own role. Ask another admin to do this.
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || !isDirty}
          className="flex items-center gap-2 min-w-[150px] justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving&hellip;
            </>
          ) : (
            <>
              <Save className="size-4" /> Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
