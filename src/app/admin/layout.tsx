'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Users, Settings, LogOut, Terminal, Menu, X } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarLinks = [
    { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Manage Events', href: '/events', icon: Calendar }, // Links back to main events listing page
    { label: 'Registrations', href: '/admin/dashboard#registrations', icon: Users },
  ];

  const isLinkActive = (href: string) => pathname === href;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950/20">
      
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
                AD
              </div>
              <div>
                <p className="text-xs font-bold text-slate-300">Admin Account</p>
                <p className="text-[10px] text-slate-500 font-mono">admin@campuscoder.org</p>
              </div>
            </div>
            
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </div>

    </div>
  );
}
