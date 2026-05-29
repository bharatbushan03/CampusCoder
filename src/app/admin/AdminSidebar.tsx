'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, Users, LogOut, Terminal, Menu, X, Bell, Link2, BookOpen } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface AdminSidebarProps {
  email: string;
  role: string;
}

export default function AdminSidebar({ email, role }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarLinks = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Manage Events', href: '/admin/events', icon: Calendar },
    { label: 'Registrations', href: '/admin/registrations', icon: Users },
    { label: 'Announcements', href: '/admin/announcements', icon: Bell },
    { label: 'Community Links', href: '/admin/community-links', icon: Link2 },
    { label: 'Resource Library', href: '/admin/resources', icon: BookOpen },
  ];

  const isLinkActive = (href: string) => pathname === href;

  const handleSignOut = async () => {
    try {
      const supabase = createClient() as any;
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const initials = email ? email.substring(0, 2).toUpperCase() : 'AD';

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden absolute top-3.5 right-16 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-16 left-0 z-40 w-64 border-r border-slate-900 bg-slate-950 p-6 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static`}
      >
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
                Console Panel
              </span>
            </div>

            <nav className="space-y-1">
              {sidebarLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isLinkActive(link.href)
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer / Log out */}
          <div className="pt-6 border-t border-slate-900">
            <div className="flex items-center gap-3 px-3 py-2 mb-4">
              <div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono text-sm font-semibold text-emerald-400">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-300 truncate">Console User</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{email}</p>
                <span className="inline-block text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-1.5 py-0.2 rounded mt-0.5 capitalize">{role}</span>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-left cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
