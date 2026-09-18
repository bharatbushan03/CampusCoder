import React from 'react';
import { redirect } from 'next/navigation';
import { serverApi } from '@/lib/serverApi';
import AdminSidebar from './AdminSidebar';

type MeResponse = {
  ok: boolean;
  user: { id: string; email?: string };
  profile: {
    id: string;
    email?: string | null;
    role: string;
    full_name?: string | null;
  } | null;
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let me: MeResponse | null = null;
  
  try {
    me = await serverApi<MeResponse>('/auth/me');
  } catch {
    // Fall through to redirect
  }

  if (!me?.user) {
    redirect('/login?redirect=/admin');
  }

  const profile = me.profile;
  if (!profile || (profile.role !== 'admin' && profile.role !== 'organizer')) {
    redirect('/');
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 overflow-hidden bg-slate-950/20">
      {/* Sidebar Navigation */}
      <AdminSidebar email={me.user.email || profile.email || ''} role={profile.role} />

      {/* Main Panel Content Area */}
      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}