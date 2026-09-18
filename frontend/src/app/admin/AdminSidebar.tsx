'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  BarChart2,
  Activity,
  UserCheck,
  Sparkles,
  Trophy,
  GraduationCap,
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
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
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
      { label: 'Notes (PDFs)', href: '/admin/notes', icon: GraduationCap },
    ],
  },
  {
    label: 'Community',
    links: [
      { label: 'Showcase', href: '/admin/showcase', icon: Sparkles },
      { label: 'Competitions', href: '/admin/competitions', icon: Trophy },
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cc_admin_sidebar_collapsed');
      if (saved !== null) {
        setCollapsed(saved === 'true');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cc_admin_sidebar_collapsed', String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

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
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed bottom-6 right-6 z-50 lg:hidden p-3 rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-transform active:scale-95 focus:outline-none"
        aria-label={mobileOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
      >
        {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {/* Sidebar Element */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out shrink-0
          lg:static lg:z-auto lg:sticky lg:top-0 lg:h-full overflow-hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-18 lg:w-18' : 'w-60 lg:w-60'}
        `}
      >
        {/* Header with Title & Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800/60 shrink-0">
          <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <LayoutDashboard className="size-4 text-emerald-400" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-50 leading-tight truncate">CampusCoder</p>
                <p className="text-[10px] text-emerald-400 font-mono">Admin Console</p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={toggleCollapse}
            className={`hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors ${
              collapsed ? 'absolute -right-3 top-5 bg-slate-900 border border-slate-800 rounded-full shadow-md z-10' : ''
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>

          {/* Mobile Close Button inside header */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-4 space-y-5 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2.5 mb-1.5 font-mono">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.links.map((link) => {
                  const Icon = link.icon;
                  const active = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? link.label : undefined}
                      className={`flex items-center ${
                        collapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2'
                      } rounded-lg text-sm transition-all group ${
                        active
                          ? 'bg-emerald-500/10 text-emerald-400 font-medium shadow-sm shadow-emerald-500/5'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`size-4 shrink-0 transition-transform ${active ? 'text-emerald-400' : 'group-hover:scale-110'}`} />
                        {!collapsed && <span>{link.label}</span>}
                      </span>
                      {!collapsed && active && (
                        <ChevronRight className="size-3.5 text-emerald-400 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-slate-800/60 shrink-0 space-y-2">
          <div
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'gap-2.5 px-2'
            } py-1`}
            title={collapsed ? `${email} (${role})` : undefined}
          >
            <div className="size-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-semibold text-emerald-400 shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200 truncate">{email}</p>
                <span className="inline-block text-[9px] font-mono font-medium bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded mt-0.5 uppercase tracking-wider">
                  {role}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            title={collapsed ? 'Sign out' : undefined}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'
            } rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer`}
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
