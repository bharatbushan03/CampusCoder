'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  Search,
  Filter,
  Edit2,
  Eye,
  Plus,
  Users,
  ChevronRight,
  Download,
  Shield,
  UserCheck,
  StarIcon,
  GraduationCap as GraduationCapIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type StudentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  college: string | null;
  branch: string | null;
  year: string | null;
  created_at: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const loadStudents = async () => {
    try {
      const data = await api<{ profiles: StudentProfile[] }>('/admin/students');
      setStudents(data.profiles || []);
    } catch (err) {
      console.warn('Failed to load students:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleChangeRole = async (id: string, currentRole: string) => {
    const newRole = prompt('Enter new role (student, admin, or organizer):', currentRole);
    if (!newRole) return;
    
    const validRoles = ['student', 'admin', 'organizer'];
    if (!validRoles.includes(newRole.toLowerCase().trim())) {
      toast.error('Invalid role. Must be: student, admin, or organizer.');
      return;
    }

    const normalizedRole = newRole.toLowerCase().trim();

    try {
      await api(`/admin/students/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: normalizedRole }),
      });
      setStudents(prev => prev.map(s => s.id === id ? { ...s, role: normalizedRole } : s));
      toast.success(`Role updated to ${normalizedRole}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      toast.error(message);
    }
  };

  const handleViewDetails = (id: string) => {
    router.push(`/admin/students/${id}`);
  };

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      toast.error('No students available to export.');
      return;
    }
    const headers = ['Full Name', 'Email', 'Role', 'College', 'Branch', 'Year', 'Joined Date'];
    const rows = filteredStudents.map(s => [
      `"${(s.full_name || '').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${s.role}"`,
      `"${(s.college || '').replace(/"/g, '""')}"`,
      `"${(s.branch || '').replace(/"/g, '""')}"`,
      `"${(s.year || '').replace(/"/g, '""')}"`,
      `"${new Date(s.created_at).toLocaleDateString()}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Students exported to CSV');
  };

  // Only show students for dashboard
  const studentList = students.filter(
    student => student.role === 'student'
  );

  const filteredStudents = studentList.filter(student => {
    const searchLower = searchQuery.toLowerCase();

    const fullNameMatch = student.full_name?.toLowerCase().includes(searchLower) || false;
    const emailMatch = student.email?.toLowerCase().includes(searchLower) || false;
    const collegeMatch = student.college?.toLowerCase().includes(searchLower) || false;
    const branchMatch = student.branch?.toLowerCase().includes(searchLower) || false;

    return fullNameMatch || emailMatch || collegeMatch || branchMatch;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-24 bg-slate-950/50 border border-slate-900 rounded-lg"
            />
          ))}
        </div>
        <div className="h-64 bg-slate-950/50 border border-slate-900 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight font-mono">
            Student Management
          </h1>
          <p className="text-sm text-slate-400">
            View and manage all student profiles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCSV} className="flex items-center gap-2">
            <Download className="size-4" />
            Export CSV
          </Button>
          <Link href="/admin/students">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="size-4" />
              Manage All
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-900 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Total Students
              </p>
              <p className="text-2xl font-bold text-white font-mono mt-1">
                {studentList.length}
              </p>
            </div>
            <Users className="size-6 text-emerald-400" />
          </div>
        </Card>

        <Card className="border-slate-900 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Admins
              </p>
              <p className="text-2xl font-bold text-white font-mono mt-1">
                {students.filter(s => s.role === 'admin').length}
              </p>
            </div>
            <Shield className="size-6 text-cyan-400" />
          </div>
        </Card>

        <Card className="border-slate-900 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Organizers
              </p>
              <p className="text-2xl font-bold text-white font-mono mt-1">
                {students.filter(s => s.role === 'organizer').length}
              </p>
            </div>
            <StarIcon className="size-6 text-purple-400" />
          </div>
        </Card>

        <Card className="border-slate-900 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Active
              </p>
              <p className="text-2xl font-bold text-white font-mono mt-1">
                {filteredStudents.length}
              </p>
            </div>
            <UserCheck className="size-6 text-amber-400" />
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="border-slate-900 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 appearance-none"
            >
              <option value="">All Students</option>
              <option value="student">Student Only</option>
            </select>
          </div>

          <Link href="/admin/students" className="w-full md:w-auto">
            <Button variant="secondary" className="w-full justify-center">
              Go to Full List
              <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Student List */}
      <Card className="border-slate-900 p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredStudents.map(student => (
            <div
              key={student.id}
              className="border border-slate-900 bg-slate-950/50 rounded-lg p-4 hover:border-emerald-500/30 hover:bg-slate-950/70 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    {student.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {student.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      {student.email}
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="text-[10px] capitalize">
                  {student.role}
                </Badge>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <GraduationCapIcon className="size-3" />
                  <span>{student.college || 'No college'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCapIcon className="size-3" />
                  <span>{student.branch || '-'} • Year {student.year || '-'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900/50 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleChangeRole(student.id, student.role)}
                >
                  <Edit2 className="size-3" />
                  Role
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleViewDetails(student.id)}
                >
                  <Eye className="size-3" />
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Empty State */}
      {filteredStudents.length === 0 && students.length > 0 && (
        <div className="text-center py-12 bg-slate-950/50 border border-slate-900 rounded-lg">
          <Users className="size-12 text-slate-800 mx-auto mb-4" />
          <p className="text-sm text-slate-500">No students found matching your search.</p>
        </div>
      )}

      {students.length === 0 && (
        <div className="text-center py-12 bg-slate-950/50 border border-slate-900 rounded-lg">
          <Users className="size-12 text-slate-800 mx-auto mb-4" />
          <p className="text-sm text-slate-500">No students found in the database.</p>
        </div>
      )}
    </div>
  );
}