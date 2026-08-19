'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  Menu,
  X,
  Bell,
  Link2,
  BookOpen,
  ChevronRight,
  BarChart2,
  Server,
  GraduationCap,
  Activity,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface AdminSidebarProps {
  email: string;
  role: string;
}

const navGroups = [
  {
    label: 'Main',
    links: [
      { label: 'Overview', href: '/admin', icon: LayoutDashboard },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
      { label: 'System', href: '/admin/system', icon: Activity },
    ],
  },
  {
    label: 'Content',
    links: [
      { label: 'Events', href: '/admin/events', icon: Calendar },
      { label: 'Registrations', href: '/admin/registrations', icon: Users },
      { label: 'Students', href: '/admin/students', icon: UserCheck },
    ],
  },
  {
    label: 'Community',
    links: [
      { label: 'Announcements', href: '/admin/announcements', icon: Bell },
      { label: 'Community Links', href: '/admin/community-links', icon: Link2 },
      { label: 'Resources', href: '/admin/resources', icon: BookOpen },
    ],
  },
];

export default function AdminSidebar({ email, role }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLinkActive = (href: string) => {
    if (href === '/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const initials = email ? email.substring(0, 2).toUpperCase() : 'AD';

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 right-4 z-50 lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 border-r border-slate-800/60 bg-slate-950 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-800/60 shrink-0">
          <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <LayoutDashboard className="size-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-50 leading-tight">CampusCoder</p>
            <p className="text-[10px] text-slate-600 font-mono">Admin Console</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 px-2 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.links.map((link) => {
                  const Icon = link.icon;
                  const active = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                        active
                          ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="size-4" />
                        <span>{link.label}</span>
                      </span>
                      {active && <ChevronRight className="size-3.5 text-emerald-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-800/60 shrink-0 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="size-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-semibold text-emerald-400 shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-300 truncate">{email}</p>
              <span className="inline-block text-[9px] font-medium bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded mt-0.5 capitalize">
                {role}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

