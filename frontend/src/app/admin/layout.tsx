import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // 1. Get authenticated user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. Fetch role from public.profiles using uuid
  const { data: profile, error: dbError } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  // If no profile found or the role is student, redirect to home page safely
  if (dbError || !profile || (profile.role !== 'admin' && profile.role !== 'organizer')) {
    redirect('/');
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950/20">
      {/* Sidebar Navigation */}
      <AdminSidebar email={user.email || profile.email || ''} role={profile.role} />

      {/* Main Panel Content Area */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
