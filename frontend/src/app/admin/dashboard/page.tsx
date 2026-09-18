'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  TrendingUp,
  School,
  Code2,
  Activity,
  Plus,
  RotateCw,
  Award,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface AnalyticsPayload {
  ok: boolean;
  summary: {
    totalStudents: number;
    totalAdmins: number;
    totalOrganizers: number;
    totalEvents: number;
    publishedEvents: number;
    completedEvents: number;
    totalRegistrations: number;
    attendedCount: number;
    attendanceRate: number;
  };
  timeline: { date: string; registrations: number; signups: number }[];
  eventsByType: { type: string; count: number }[];
  eventsByStatus: { status: string; count: number }[];
  topEvents: {
    event: string;
    eventId: string;
    date: string;
    type: string;
    count: number;
    attended: number;
    rate: number;
  }[];
  topColleges: { college: string; count: number }[];
  topBranches: { branch: string; count: number }[];
  yearDistribution: { year: string; count: number }[];
  codingLevels: { level: string; count: number }[];
  preferredLanguages: { language: string; count: number }[];
  recentRegistrations: {
    id: string;
    type: 'registration';
    name: string;
    email: string;
    event: string;
    time: string;
    status: string;
  }[];
  recentSignups: {
    id: string;
    type: 'signup';
    name: string;
    email: string;
    college: string | null;
    role: string;
    time: string;
  }[];
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  const fetchAnalytics = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api<AnalyticsPayload>('/admin/analytics');
      setData(res);
      if (isManual) toast.success('Analytics refreshed');
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      toast.error('Failed to load analytics from database');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading || !data) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-4 w-36" />
          <Skeleton variant="text" className="h-8 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="card" className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" className="h-80 lg:col-span-2" />
          <Skeleton variant="card" className="h-80" />
        </div>
      </div>
    );
  }

  const { summary, timeline, topEvents, topColleges, preferredLanguages, recentRegistrations, recentSignups } = data;

  // Compute max for chart scaling
  const maxTimelineVal = Math.max(
    ...timeline.map((t) => Math.max(t.registrations, t.signups, 1)),
    5
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">
            Admin <span className="text-emerald-500">Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time analytics and telemetry across students, events, and registrations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-mono"
          >
            <RotateCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Link href="/admin/events">
            <Button variant="primary" className="flex items-center gap-1.5 text-xs font-mono">
              <Plus className="size-3.5" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/50 p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Students</p>
            <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white font-mono">{summary.totalStudents}</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
              <span>{summary.totalAdmins} Admins</span>
              <span>•</span>
              <span>{summary.totalOrganizers} Organizers</span>
            </div>
          </div>
          <Link
            href="/admin/students"
            className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 pt-1"
          >
            Manage Accounts &rarr;
          </Link>
        </Card>

        {/* Total RSVPs */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total RSVPs</p>
            <div className="size-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-cyan-400 font-mono">{summary.totalRegistrations}</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
              <span className="text-emerald-400">{summary.attendedCount} Attended</span>
              <span>•</span>
              <span>{summary.attendanceRate}% Attendance Rate</span>
            </div>
          </div>
          <Link
            href="/admin/registrations"
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 pt-1"
          >
            View Registrations &rarr;
          </Link>
        </Card>

        {/* Events Hosted */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Events Hosted</p>
            <div className="size-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Calendar className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-purple-400 font-mono">{summary.totalEvents}</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
              <span>{summary.publishedEvents} Published</span>
              <span>•</span>
              <span>{summary.completedEvents} Completed</span>
            </div>
          </div>
          <Link
            href="/admin/events"
            className="text-[11px] font-mono text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 pt-1"
          >
            View All Events &rarr;
          </Link>
        </Card>

        {/* Campuses Represented */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Campuses</p>
            <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <School className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-amber-400 font-mono">{topColleges.length}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">
              Top: {topColleges[0]?.college || 'All Campuses'}
            </p>
          </div>
          <Link
            href="/admin/analytics"
            className="text-[11px] font-mono text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 pt-1"
          >
            Detailed Analytics &rarr;
          </Link>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Activity Chart (2 cols) */}
        <Card hoverEffect={false} className="lg:col-span-2 border-slate-900 bg-slate-950/40 p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
                <Activity className="size-4 text-emerald-400" /> 14-Day Activity & Growth
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Real daily RSVPs and new student registrations</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400" /> Event RSVPs
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="size-2 rounded-full bg-cyan-400" /> New Signups
              </span>
            </div>
          </div>

          {/* SVG Bar / Trend Chart */}
          <div className="h-56 w-full flex items-end gap-2 pt-6 pb-2">
            {timeline.map((item, idx) => {
              const regHeight = (item.registrations / maxTimelineVal) * 100;
              const signupHeight = (item.signups / maxTimelineVal) * 100;
              const dateLabel = item.date.slice(5);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-900 border border-slate-700 text-[10px] font-mono p-1.5 rounded shadow-xl pointer-events-none whitespace-nowrap">
                    <span className="text-slate-400">{item.date}</span>
                    <span className="text-emerald-400">{item.registrations} RSVPs</span>
                    <span className="text-cyan-400">{item.signups} Signups</span>
                  </div>

                  {/* Bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-44">
                    <div
                      style={{ height: `${Math.max(regHeight, 4)}%` }}
                      className="w-1/2 max-w-[12px] bg-emerald-500 rounded-t transition-all group-hover:bg-emerald-400"
                    />
                    <div
                      style={{ height: `${Math.max(signupHeight, 4)}%` }}
                      className="w-1/2 max-w-[12px] bg-cyan-500 rounded-t transition-all group-hover:bg-cyan-400"
                    />
                  </div>

                  {/* Date label */}
                  <span className="text-[9px] font-mono text-slate-500 mt-2 truncate max-w-full">{dateLabel}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Campuses Breakdown (1 col) */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
              <School className="size-4 text-amber-400" /> Top Campuses
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Students by College & University</p>
          </div>

          {topColleges.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              No campus data available yet.
            </div>
          ) : (
            <div className="space-y-3.5 pt-2">
              {topColleges.map((col, idx) => {
                const totalStudents = summary.totalStudents || 1;
                const percent = Math.min(Math.round((col.count / totalStudents) * 100), 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200 truncate max-w-[180px]" title={col.college}>
                        {col.college}
                      </span>
                      <span className="text-emerald-400 font-bold">{col.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Second Row: Top Events Performance + Preferred Languages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Events Leaderboard (2 cols) */}
        <Card hoverEffect={false} className="lg:col-span-2 border-slate-900 bg-slate-950/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
                <Award className="size-4 text-purple-400" /> Event Performance
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Top workshops and sessions ranked by RSVPs</p>
            </div>
            <Link
              href="/admin/events"
              className="text-xs font-mono text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
            >
              All Events &rarr;
            </Link>
          </div>

          {topEvents.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              No events created yet. Create one to view performance metrics.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    <th className="pb-3 font-semibold">Event Title</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold text-center">RSVPs</th>
                    <th className="pb-3 font-semibold text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-xs font-mono">
                  {topEvents.map((ev, i) => (
                    <tr key={i} className="hover:bg-slate-900/20">
                      <td className="py-3 font-semibold text-white truncate max-w-xs">{ev.event}</td>
                      <td className="py-3">
                        <Badge variant="default" className="text-[9px] capitalize">
                          {ev.type}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-400">{ev.date}</td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-bold">
                          {ev.count}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-emerald-400 font-bold">{ev.rate}%</span>
                          <span className="text-[10px] text-slate-500">({ev.attended} attended)</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Skill & Language Distribution (1 col) */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
              <Code2 className="size-4 text-cyan-400" /> Tech Stacks
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Top coding languages preferred by students</p>
          </div>

          {preferredLanguages.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              No tech stack preferences recorded yet.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {preferredLanguages.map((lang, idx) => {
                const totalRegs = summary.totalRegistrations || 1;
                const percent = Math.min(Math.round((lang.count / totalRegs) * 100), 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200">{lang.language}</span>
                      <span className="text-cyan-400 font-bold">{lang.count} RSVPs</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Third Row: Recent Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent RSVPs */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-400" /> Recent Event RSVPs
            </h2>
            <Link
              href="/admin/registrations"
              className="text-xs font-mono text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1"
            >
              View All &rarr;
            </Link>
          </div>

          {recentRegistrations.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              No registrations recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-900/60">
              {recentRegistrations.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs font-mono">
                  <div className="space-y-0.5 truncate max-w-xs">
                    <p className="font-semibold text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-emerald-400 truncate">{item.event}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      variant={item.status === 'attended' ? 'success' : 'default'}
                      className="text-[9px] capitalize"
                    >
                      {item.status}
                    </Badge>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(item.time).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Student Signups */}
        <Card hoverEffect={false} className="border-slate-900 bg-slate-950/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
              <Users className="size-4 text-cyan-400" /> Recent Community Members
            </h2>
            <Link
              href="/admin/students"
              className="text-xs font-mono text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1"
            >
              Manage &rarr;
            </Link>
          </div>

          {recentSignups.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              No member signups recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-900/60">
              {recentSignups.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs font-mono">
                  <div className="space-y-0.5 truncate max-w-xs">
                    <p className="font-semibold text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{item.college || item.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      variant={
                        item.role === 'admin' ? 'accent' : item.role === 'organizer' ? 'success' : 'default'
                      }
                      className="text-[9px] capitalize"
                    >
                      {item.role}
                    </Badge>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(item.time).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}