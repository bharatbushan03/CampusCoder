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
    redirect('/login');
  }

  if (!me?.user) {
    redirect('/login');
  }

  const profile = me.profile;
  if (!profile || (profile.role !== 'admin' && profile.role !== 'organizer')) {
    redirect('/');
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950/20">
      {/* Sidebar Navigation */}
      <AdminSidebar email={me.user.email || profile.email || ''} role={profile.role} />

      {/* Main Panel Content Area */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}