'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, Users, Eye, PlusCircle, CheckCircle2, UserCheck, Mail, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState([
    { label: 'Upcoming Events', value: '4', icon: Calendar, color: 'text-emerald-400' },
    { label: 'Total Registrations', value: '5', icon: Users, color: 'text-cyan-400' },
    { label: 'Active Members', value: '150+', icon: UserCheck, color: 'text-purple-400' },
  ]);

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isDbOffline, setIsDbOffline] = useState(false);

  // Mock fallback lists if database is not active
  const fallbackRegistrations = [
    {
      id: 'reg-1',
      full_name: 'Aman Sharma',
      email: 'aman.sharma@college.edu',
      events: { title: 'Cracking the Coding Interview: AMA' },
      registered_at: '2026-05-28T10:00:00Z',
      attendance_status: 'registered',
    },
    {
      id: 'reg-2',
      full_name: 'Priya Iyer',
      email: 'priya.iyer@college.edu',
      events: { title: 'Hands-on React & Next.js Workshop' },
      registered_at: '2026-05-28T08:30:00Z',
      attendance_status: 'registered',
    },
    {
      id: 'reg-3',
      full_name: 'Kabir Verma',
      email: 'kabir.v@college.edu',
      events: { title: 'Weekly Coding Sprint: HackerRank practice' },
      registered_at: '2026-05-27T14:15:00Z',
      attendance_status: 'registered',
    },
  ];

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const supabase = createClient() as any;

        // Load stats counts in parallel
        const [eventsRes, regsRes, membersRes, recentRegsRes] = await Promise.all([
          supabase.from('events').select('*', { count: 'exact', head: true }),
          supabase.from('registrations').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase
            .from('registrations')
            .select(`
              id,
              full_name,
              email,
              registered_at,
              attendance_status,
              events (
                title
              )
            `)
            .order('registered_at', { ascending: false })
            .limit(10)
        ]);

        if (eventsRes.error) throw eventsRes.error;
        if (regsRes.error) throw regsRes.error;

        const eventsCount = eventsRes.count !== null ? String(eventsRes.count) : '0';
        const regsCount = regsRes.count !== null ? String(regsRes.count) : '0';
        const membersCount = membersRes.count !== null && membersRes.count > 0 ? String(membersRes.count) : '150+';

        setStats([
          { label: 'Upcoming Events', value: eventsCount, icon: Calendar, color: 'text-emerald-400' },
          { label: 'Total Registrations', value: regsCount, icon: Users, color: 'text-cyan-400' },
          { label: 'Active Members', value: membersCount, icon: UserCheck, color: 'text-purple-400' },
        ]);

        if (recentRegsRes.data && recentRegsRes.data.length > 0) {
          setRegistrations(recentRegsRes.data);
        } else {
          setRegistrations([]);
        }
      } catch (err: any) {
        console.warn('Supabase stats query failed, loading demo dashboard dashboard values');
        setIsDbOffline(true);
        setRegistrations(fallbackRegistrations);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track student interactions, RSVP logs, and general community metrics.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/register">
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Add Member
            </Button>
          </Link>
          <Link href="/events">
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> View Live Sprints
            </Button>
          </Link>
        </div>
      </div>

      {/* Database warning badge */}
      {isDbOffline && (
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-emerald-500/10 rounded-xl text-xs text-slate-400">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>Local Demo Mode: Running on simulated metrics. Make sure to run SQL migration and configure env credentials.</span>
        </div>
      )}

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} hoverEffect={true} className="flex items-center justify-between border-slate-900">
              <div>
                <p className="text-xs font-mono font-medium uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
                <p className="text-3xl font-mono font-bold text-white mt-2">{stat.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-900 ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Registrations List Section */}
      <div id="registrations" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Recent Registrations</h2>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            Live Feed
          </span>
        </div>

        {registrations.length > 0 ? (
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
                  {registrations.map((reg) => {
                    const eventTitle = reg.events?.title || 'General RSVP / Workshop';
                    return (
                      <tr key={reg.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-white">{reg.full_name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" /> {reg.email}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-200">
                          {eventTitle}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-400">
                          {new Date(reg.registered_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded capitalize">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {reg.attendance_status || reg.status || 'registered'}
                          </span>
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
            <p className="text-sm font-mono text-slate-500">No event registrations recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
