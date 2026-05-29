'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, Users, Eye, PlusCircle, CheckCircle2, UserCheck, Mail } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const stats = [
    { label: 'Upcoming Events', value: '4', icon: Calendar, color: 'text-emerald-400' },
    { label: 'Total Registrations', value: '361', icon: Users, color: 'text-cyan-400' },
    { label: 'Active Members', value: '150+', icon: UserCheck, color: 'text-purple-400' },
  ];

  // Mock registrations list
  const recentRegistrations = [
    {
      id: 'reg-1',
      name: 'Aman Sharma',
      email: 'aman.sharma@college.edu',
      event: 'Cracking the Coding Interview: AMA',
      date: '2026-05-28',
      status: 'Confirmed',
    },
    {
      id: 'reg-2',
      name: 'Priya Iyer',
      email: 'priya.iyer@college.edu',
      event: 'Hands-on React & Next.js Workshop',
      date: '2026-05-28',
      status: 'Confirmed',
    },
    {
      id: 'reg-3',
      name: 'Kabir Verma',
      email: 'kabir.v@college.edu',
      event: 'Weekly Coding Sprint: HackerRank practice',
      date: '2026-05-27',
      status: 'Confirmed',
    },
    {
      id: 'reg-4',
      name: 'Riya Sen',
      email: 'riya.sen@college.edu',
      event: 'Hands-on React & Next.js Workshop',
      date: '2026-05-27',
      status: 'Confirmed',
    },
    {
      id: 'reg-5',
      name: 'Nikhil Das',
      email: 'nikhil.das@college.edu',
      event: 'Cracking the Coding Interview: AMA',
      date: '2026-05-26',
      status: 'Confirmed',
    },
  ];

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
                {recentRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{reg.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" /> {reg.email}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-200">
                      {reg.event}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      {reg.date}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {reg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
