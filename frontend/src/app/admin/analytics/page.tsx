'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Calendar,
  Activity,
  PieChart,
  Download,
  School,
  Code2,
  RotateCw,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface BackendAnalytics {
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
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtext?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <Card hoverEffect={false} className="p-5 border-slate-900 bg-slate-950/40">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className={`size-8 rounded-lg flex items-center justify-center border ${colorMap[color] || colorMap.emerald}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-white font-mono">{value}</p>
      {subtext && <p className="text-[11px] text-slate-400 font-mono mt-1">{subtext}</p>}
    </Card>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="size-4 text-emerald-400" />
      <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest">{title}</h2>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<BackendAnalytics | null>(null);

  const loadAnalytics = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api<BackendAnalytics>('/admin/analytics');
      setData(res);
      if (isManual) toast.success('Analytics refreshed');
    } catch (err) {
      console.warn('Analytics load error:', err);
      toast.error('Failed to load real analytics data');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Students', data.summary.totalStudents.toString()],
      ['Total RSVPs', data.summary.totalRegistrations.toString()],
      ['Attended', data.summary.attendedCount.toString()],
      ['Attendance Rate', `${data.summary.attendanceRate}%`],
      ['Total Events', data.summary.totalEvents.toString()],
      ['Published Events', data.summary.publishedEvents.toString()],
      [],
      ['Top Event', 'RSVPs', 'Attended', 'Attendance Rate'],
      ...data.topEvents.map((e) => [e.event, e.count.toString(), e.attended.toString(), `${e.rate}%`]),
      [],
      ['College', 'Students'],
      ...data.topColleges.map((c) => [c.college, c.count.toString()]),
      [],
      ['Tech Stack', 'RSVPs'],
      ...data.preferredLanguages.map((l) => [l.language, l.count.toString()]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campuscoder_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Analytics report exported');
  };

  if (loading || !data) {
    return (
      <div className="space-y-8">
        <div className="space-y-1">
          <Skeleton variant="text" className="h-3 w-32" />
          <Skeleton variant="text" className="h-8 w-56" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="card" className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" className="h-80" />
          <Skeleton variant="card" className="h-80" />
        </div>
      </div>
    );
  }

  const { summary, timeline, eventsByType, eventsByStatus, topEvents, topColleges, preferredLanguages, codingLevels } =
    data;
  const maxVal = Math.max(...timeline.map((t) => Math.max(t.registrations, t.signups, 1)), 5);

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
            Platform <span className="text-emerald-500">Analytics</span>
          </h1>
          <p className="text-sm text-slate-400">
            Real-time telemetry and reporting calculated directly from the database.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-mono"
          >
            <RotateCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="primary" onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs font-mono">
            <Download className="size-4" /> Export Report CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Student Members"
          value={summary.totalStudents.toLocaleString()}
          icon={Users}
          color="emerald"
          subtext={`${summary.totalAdmins} admins • ${summary.totalOrganizers} organizers`}
        />
        <MetricCard
          label="Total RSVPs Recorded"
          value={summary.totalRegistrations.toLocaleString()}
          icon={TrendingUp}
          color="cyan"
          subtext={`${summary.attendedCount} attended (${summary.attendanceRate}%)`}
        />
        <MetricCard
          label="Events Hosted"
          value={summary.totalEvents}
          icon={Calendar}
          color="purple"
          subtext={`${summary.publishedEvents} published • ${summary.completedEvents} completed`}
        />
        <MetricCard
          label="Campuses Reached"
          value={topColleges.length}
          icon={School}
          color="amber"
          subtext={`Top: ${topColleges[0]?.college || 'All Campuses'}`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 14-Day Timeline Bar Chart */}
        <Card hoverEffect={false} className="p-6 border-slate-900 bg-slate-950/40 space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader title="14-Day Registrations & Growth" icon={Activity} />
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400" /> RSVPs
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="size-2 rounded-full bg-cyan-400" /> Signups
              </span>
            </div>
          </div>

          <div className="h-64 flex items-end gap-2 pt-6 pb-2">
            {timeline.map((item, idx) => {
              const regH = (item.registrations / maxVal) * 100;
              const signH = (item.signups / maxVal) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div className="absolute -top-10 z-20 hidden group-hover:flex flex-col items-center bg-slate-900 border border-slate-700 text-[10px] font-mono p-1 rounded whitespace-nowrap shadow-xl">
                    <span className="text-slate-400">{item.date}</span>
                    <span className="text-emerald-400">{item.registrations} RSVPs</span>
                    <span className="text-cyan-400">{item.signups} Signups</span>
                  </div>

                  <div className="w-full flex items-end justify-center gap-0.5 h-48">
                    <div
                      style={{ height: `${Math.max(regH, 4)}%` }}
                      className="w-1/2 max-w-[10px] bg-emerald-500 rounded-t"
                    />
                    <div
                      style={{ height: `${Math.max(signH, 4)}%` }}
                      className="w-1/2 max-w-[10px] bg-cyan-500 rounded-t"
                    />
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 mt-2 truncate">{item.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Campuses Leaderboard */}
        <Card hoverEffect={false} className="p-6 border-slate-900 bg-slate-950/40 space-y-4">
          <SectionHeader title="Top Campuses & Colleges" icon={School} />
          {topColleges.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-slate-500">No campus records yet.</div>
          ) : (
            <div className="space-y-3.5 pt-2">
              {topColleges.map((col, idx) => {
                const totalStudents = summary.totalStudents || 1;
                const percent = Math.min(Math.round((col.count / totalStudents) * 100), 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200 truncate max-w-[220px]">{col.college}</span>
                      <span className="text-emerald-400 font-bold">{col.count} members</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
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

        {/* Events by Type */}
        <Card hoverEffect={false} className="p-6 border-slate-900 bg-slate-950/40 space-y-4">
          <SectionHeader title="Events by Type" icon={PieChart} />
          {eventsByType.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-slate-500">No events recorded.</div>
          ) : (
            <div className="space-y-3 pt-2">
              {eventsByType.map((t, idx) => {
                const totalEvents = summary.totalEvents || 1;
                const pct = Math.round((t.count / totalEvents) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200">{t.type}</span>
                      <span className="text-purple-400 font-bold">
                        {t.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Tech Stacks & Languages */}
        <Card hoverEffect={false} className="p-6 border-slate-900 bg-slate-950/40 space-y-4">
          <SectionHeader title="Preferred Programming Languages" icon={Code2} />
          {preferredLanguages.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-slate-500">No language data recorded.</div>
          ) : (
            <div className="space-y-3 pt-2">
              {preferredLanguages.map((l, idx) => {
                const totalRegs = summary.totalRegistrations || 1;
                const pct = Math.round((l.count / totalRegs) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200">{l.language}</span>
                      <span className="text-cyan-400 font-bold">
                        {l.count} RSVPs ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Event Performance Leaderboard */}
        <Card hoverEffect={false} className="p-6 border-slate-900 bg-slate-950/40 space-y-4 lg:col-span-2">
          <SectionHeader title="Event Performance Leaderboard" icon={Award} />
          {topEvents.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500">No events found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    <th className="pb-3 font-semibold">Event</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold text-center">RSVPs</th>
                    <th className="pb-3 font-semibold text-center">Attended</th>
                    <th className="pb-3 font-semibold text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-xs font-mono">
                  {topEvents.map((ev, i) => (
                    <tr key={i} className="hover:bg-slate-900/20">
                      <td className="py-3 font-semibold text-white truncate max-w-sm">{ev.event}</td>
                      <td className="py-3 text-slate-400">{ev.date}</td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-bold">
                          {ev.count}
                        </span>
                      </td>
                      <td className="py-3 text-center text-emerald-400 font-bold">{ev.attended}</td>
                      <td className="py-3 text-right">
                        <span className="text-emerald-400 font-bold">{ev.rate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}