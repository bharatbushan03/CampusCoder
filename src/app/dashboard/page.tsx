'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  LogOut,
  Loader2,
  X,
  ShieldAlert,
  GraduationCap,
  School,
  BookOpen,
  Settings,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/types/database.types';
import type { User } from '@supabase/supabase-js';

type ProfileType = Database['public']['Tables']['profiles']['Row'];
type EventRow = Database['public']['Tables']['events']['Row'];
type RegistrationType = Database['public']['Tables']['registrations']['Row'] & {
  events: EventRow;
};

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationType[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const currentDate = new Date();

  const [editForm, setEditForm] = useState<{
    full_name: string;
    college: string | null;
    branch: string | null;
    year: string | null;
  }>({
    full_name: '',
    college: null,
    branch: null,
    year: null
  });

  const loadDashboardData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(user);

      const [profileRes, regRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .returns<ProfileType>(),
        supabase
          .from('registrations')
          .select('*, events(*)')
          .eq('email', user.email)
          .order('registered_at', { ascending: false })
          .returns<RegistrationType[]>(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setEditForm({
          full_name: profileRes.data.full_name || '',
          college: profileRes.data.college,
          branch: profileRes.data.branch,
          year: profileRes.data.year
        });
      }
      if (regRes.data) setRegistrations(regRes.data);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboardData();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    toast.success('Logged out successfully');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update(editForm).eq('id', user?.id || '');
      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Update failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelRegistration = async (regId: string, eventTitle: string) => {
    toast.custom((t) => (
      <Card glass={false} className="p-6 border-slate-800 bg-slate-950 max-w-sm space-y-4">
        <p className="text-sm text-slate-300 font-medium">Cancel registration for <span className="text-white font-bold">{eventTitle}</span>?</p>
        <div className="flex gap-2">
          <Button variant="danger" size="sm" className="flex-1" onClick={async () => {
            try {
              const supabase = createClient();
              await supabase.from('registrations').delete().eq('id', regId);
              setRegistrations(prev => prev.filter(r => r.id !== regId));
              toast.dismiss(t);
              toast.success('RSVP Cancelled');
            } catch (err) {
              console.error('Error canceling registration:', err);
              toast.error('Failed to cancel');
            }
          }}>Confirm</Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.dismiss(t)}>Keep it</Button>
        </div>
      </Card>
    ));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12 min-h-screen">
        <div className="flex justify-between items-center">
          <div className="h-10 w-64 skeleton"></div>
          <div className="h-10 w-32 skeleton"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-96 skeleton rounded-2xl"></div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 skeleton rounded-2xl"></div>
            <div className="h-48 skeleton rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 min-h-[calc(100vh-10rem)]">
        <Card className="max-w-md w-full p-12 text-center space-y-8 border-slate-800/40 bg-slate-900/20">
          <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 size-20 flex items-center justify-center mx-auto shadow-2xl">
            <ShieldAlert className="size-10 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white font-mono uppercase tracking-tighter">Access Locked</h1>
            <p className="text-slate-500 text-sm font-medium">Authentication required to access the student portal.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/login"><Button variant="primary" className="w-full h-12">Sign In</Button></Link>
            <Link href="/events"><Button variant="ghost" className="w-full h-12">Browse Public Events</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  const upcomingCount = registrations.filter(r => new Date(r.events.date) >= new Date()).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-12">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter font-mono uppercase">
              Member <span className="text-emerald-500">Console</span>
            </h1>
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="size-3 animate-pulse" /> Active
            </div>
          </div>
          <p className="text-slate-500 text-sm font-mono">Status: Connected to CampusCoder Hub v2.0</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" onClick={handleSignOut} className="h-11 border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/20">
            <LogOut className="size-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* LEFT COLUMN */}
        <div className="space-y-8">
          {/* Profile card */}
          <Card className="border-slate-800/60 bg-slate-900/20 overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500">Member Info</h2>
                  <p className="text-xl font-bold text-white font-mono">{profile?.full_name || 'Anonymous'}</p>
                </div>
                <button type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                >
                  {isEditingProfile ? <X className="size-4" /> : <Settings className="size-4" />}
                </button>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-5 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label htmlFor="page-display-name" className="text-[10px] font-mono text-slate-600 uppercase font-bold">Display Name</label>
                    <input id="page-display-name" value={editForm.full_name} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} className="form-input" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="page-college" className="text-[10px] font-mono text-slate-600 uppercase font-bold">College</label>
                    <input id="page-college" value={editForm.college} onChange={(e) => setEditForm({...editForm, college: e.target.value})} className="form-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="page-branch" className="text-[10px] font-mono text-slate-600 uppercase font-bold">Branch</label>
                      <input id="page-branch" value={editForm.branch} onChange={(e) => setEditForm({...editForm, branch: e.target.value})} className="form-input" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="page-batch-year" className="text-[10px] font-mono text-slate-600 uppercase font-bold">Batch Year</label>
                      <input id="page-batch-year" value={editForm.year} onChange={(e) => setEditForm({...editForm, year: e.target.value})} className="form-input" />
                    </div>
                  </div>
                  <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSavingProfile}>Save Changes</Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { icon: School, label: 'College', value: profile?.college },
                      { icon: GraduationCap, label: 'Branch', value: profile?.branch },
                      { icon: BookOpen, label: 'Year', value: profile?.year ? `${profile.year} Year` : null }
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-900/50">
                        <item.icon className="size-4 text-emerald-500/40" />
                        <div>
                          <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{item.label}</p>
                          <p className="text-sm font-medium text-slate-300">{item.value || 'Not set'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-8 border-slate-800 bg-emerald-500/5 space-y-4">
            <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-500/60">Community Engagement</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-center">
                <p className="text-2xl font-bold text-white font-mono">{registrations.length}</p>
                <p className="text-[9px] font-mono text-slate-500 uppercase">RSVPs</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-center">
                <p className="text-2xl font-bold text-white font-mono">{upcomingCount}</p>
                <p className="text-[9px] font-mono text-slate-500 uppercase">Upcoming</p>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
              <h2 className="text-2xl font-extrabold text-white font-mono uppercase tracking-tight">Your Learning Path</h2>
            </div>
            <Link href="/events"><Button variant="ghost" size="sm" className="font-bold">Explore Sprints <ArrowUpRight className="ml-2 size-4" /></Button></Link>
          </div>

          {registrations.length > 0 ? (
            <div className="space-y-4">
              {registrations.map((reg) => {
                const ev = reg.events;
                const isUpcoming = new Date(ev.date) >= currentDate;

                return (
                  <Card key={reg.id} hoverEffect={false} className="border-slate-800/60 bg-slate-900/20 p-8 hover:bg-slate-900/40 transition-all group">
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                      <div className="space-y-6 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-widest ${
                            isUpcoming ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                          }`}>
                            {isUpcoming ? 'Upcoming' : 'Completed'}
                          </span>
                          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">ID: {ev.slug}</span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-2xl font-bold text-white leading-tight font-mono group-hover:text-emerald-400 transition-colors">{ev.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-slate-500 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Calendar className="size-4 text-emerald-500/40" /> {new Date(ev.date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-2"><Clock className="size-4 text-emerald-500/40" /> {ev.start_time.slice(0,5)}</span>
                            <span className="flex items-center gap-2"><MapPin className="size-4 text-emerald-500/40" /> {ev.mode}</span>
                          </div>
                        </div>

                        {isUpcoming && ev.meeting_link && (
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between group/meet transition-all hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/5">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-lg bg-emerald-500/20 flex items-center justify-center"><ExternalLink className="size-4 text-emerald-400" /></div>
                              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Sprint Link Ready</p>
                            </div>
                            <a href={ev.meeting_link} target="_blank" rel="noopener noreferrer"><Button variant="primary" size="sm">Launch Session</Button></a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row md:flex-col justify-end gap-3 md:w-36">
                        <Link href={`/events/${ev.slug}`} className="flex-1"><Button variant="secondary" size="md" className="w-full h-11">Hub Details</Button></Link>
                        {isUpcoming && (
                          <Button variant="ghost" size="md" onClick={() => handleCancelRegistration(reg.id, ev.title)} className="flex-1 h-11 text-slate-500 hover:text-red-400">Cancel</Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-24 bg-slate-900/10 border border-dashed border-slate-800 rounded-[2.5rem] space-y-6">
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-full size-20 flex items-center justify-center mx-auto shadow-2xl"><Calendar className="size-10 text-slate-800" /></div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-white font-mono uppercase tracking-tighter">Zero active sprints</p>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">Your dashboard is currently empty. Explore upcoming sprints to begin your path.</p>
              </div>
              <Link href="/events"><Button variant="primary" size="lg" className="h-12 px-8">Find Sprints</Button></Link>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
