'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  LogOut,
  X,
  ShieldAlert,
  GraduationCap,
  School,
  BookOpen,
  Settings,
  ArrowUpRight,
  Camera,
  Loader2,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { EVENT_DATE_LABEL, EVENT_TIME_LABEL } from '@/lib/eventSchedule';
import { toast } from 'sonner';

type ProfileType = {
  id: string;
  full_name: string | null;
  college: string | null;
  branch: string | null;
  year: string | null;
  avatar_url?: string | null;
};
type EventRow = {
  id: string;
  title: string;
  slug: string;
  mode: string;
  date: string;
  meeting_link: string | null;
};
type RegistrationType = {
  id: string;
  events: EventRow;
};

function EmptyStateCard({ activeTab }: { activeTab: 'upcoming' | 'completed' }) {
  return (
    <Card className="text-center py-24 bg-slate-900/10 border border-dashed border-slate-800 rounded-[2.5rem] space-y-6">
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-full size-20 flex items-center justify-center mx-auto shadow-2xl">
        {activeTab === 'upcoming' ? <Calendar className="size-10 text-emerald-500" /> : <ArrowUpRight className="size-10 text-slate-400" />}
      </div>
      <div className="space-y-2">
        <p className="text-lg font-bold text-white font-mono uppercase tracking-tighter">
          {activeTab === 'upcoming' ? 'No upcoming sprints' : 'No completed events'}
        </p>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          {activeTab === 'upcoming'
            ? 'Your dashboard is currently empty. Explore upcoming sprints to begin your path.'
            : 'Check out our event archive to explore completed challenges and workshops.'}
        </p>
      </div>
      {activeTab === 'completed' && (
        <Link href="/events/archive"><Button variant="primary" size="lg" className="h-12 px-8">Browse Archive</Button></Link>
      )}
      {activeTab === 'upcoming' && (
        <Link href="/events"><Button variant="primary" size="lg" className="h-12 px-8">Find Sprints</Button></Link>
      )}
    </Card>
  );
}

function RegistrationCard({ reg, isUpcoming, handleCancelRegistration }: { 
  reg: RegistrationType; 
  isUpcoming: boolean; 
  handleCancelRegistration: (regId: string, eventTitle: string) => void;
}) {
  const ev = reg.events;

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
              <span className="flex items-center gap-2"><Calendar className="size-4 text-emerald-500/40" /> {EVENT_DATE_LABEL}</span>
              <span className="flex items-center gap-2"><Clock className="size-4 text-emerald-500/40" /> {EVENT_TIME_LABEL}</span>
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
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout, refresh } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationType[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const currentDate = useMemo(() => new Date(), []);

  const upcomingCount = useMemo(() => 
    registrations.filter(r => new Date(r.events.date) >= currentDate).length,
    [registrations, currentDate]
  );

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const ev = reg.events;
      const isUpcoming = new Date(ev.date) >= currentDate;
      const eventTitle = ev.title.toLowerCase();
      const eventSlug = ev.slug.toLowerCase();
      const isDSAChallenge = 
        eventSlug.includes('dsa-7-days') ||
        eventSlug.includes('master-dsa') ||
        eventTitle.includes('master dsa') ||
        eventTitle.includes('dsa in 7') ||
        eventTitle.includes('7 days challenge') ||
        eventSlug === 'dsa-7-days-challenge-2026';

      if (isDSAChallenge) return false;

      const shouldShow = activeTab === 'upcoming' ? isUpcoming : !isUpcoming;
      return shouldShow;
    });
  }, [registrations, activeTab, currentDate]);

  const [editForm, setEditForm] = useState<{
    full_name: string;
    college: string | null;
    branch: string | null;
    year: string | null;
    avatar_url?: string | null;
  }>({
    full_name: '',
    college: null,
    branch: null,
    year: null,
    avatar_url: null,
  });

  const loadDashboardData = async () => {
    try {
      const data = await api<{ ok: boolean; profile: ProfileType | null; registrations: RegistrationType[] }>('/me');
      if (data.profile) {
        setProfile(data.profile);
        setEditForm({
          full_name: data.profile.full_name || '',
          college: data.profile.college,
          branch: data.profile.branch,
          year: data.profile.year,
          avatar_url: data.profile.avatar_url ?? null,
        });
      }
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?redirect=/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      void loadDashboardData();
    } else {
      setDataLoading(false);
    }
  }, [user, authLoading]);

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
    toast.success('Logged out successfully');
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so selecting the same file triggers change if desired
    e.target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile picture must be under 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif'];
    const isImage = allowedTypes.includes(file.type.toLowerCase()) || /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.name);
    if (!isImage) {
      toast.error('Please choose a valid image file (PNG, JPG, WEBP, HEIC)');
      return;
    }

    setIsUploadingAvatar(true);
    const toastId = toast.loading('Uploading profile picture...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/me/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Upload failed (${res.status})`);
      }

      const newAvatarUrl = (data.url as string) || null;
      setProfile(prev => prev ? { ...prev, avatar_url: newAvatarUrl } : null);
      setEditForm(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      await refresh();
      toast.success('Profile picture updated!', { id: toastId });
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      toast.error(err.message || 'Failed to upload profile picture', { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    const toastId = toast.loading('Removing profile picture...');
    try {
      await api('/me', {
        method: 'PUT',
        body: JSON.stringify({ ...editForm, avatar_url: null }),
      });
      setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
      setEditForm(prev => ({ ...prev, avatar_url: null }));
      await refresh();
      toast.success('Profile picture removed', { id: toastId });
    } catch (err: any) {
      console.error('Error removing avatar:', err);
      toast.error(err.message || 'Failed to remove avatar', { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      await api('/me', {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });

      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditingProfile(false);
      await refresh();
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
              await api(`/me/registrations/${regId}`, { method: 'DELETE' });
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

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12 min-h-screen">
        <div className="flex justify-between items-center">
          <Skeleton variant="button" className="w-64" />
          <Skeleton variant="button" className="w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton variant="card" className="h-96" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-12">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter font-mono uppercase">
              Member <span className="text-emerald-500">Console</span>
            </h1>
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
          <Card className="border-slate-800/60 bg-slate-900/20 overflow-hidden hover:border-slate-700/60 transition-all">
            <div className="p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500">Member Info</h2>
                  <p className="text-xl font-bold text-white font-mono">{profile?.full_name || 'Anonymous'}</p>
                </div>
                <button type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all hover:scale-105"
                  title={isEditingProfile ? "Close edit" : "Edit profile info"}
                >
                  {isEditingProfile ? <X className="size-4" /> : <Settings className="size-4" />}
                </button>
              </div>

              {/* Avatar Section */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70">
                <div className="relative group shrink-0">
                  <div className="size-20 rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-slate-900 flex items-center justify-center relative shadow-lg shadow-emerald-950/20">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.full_name || 'Profile photo'}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 text-emerald-400 font-mono font-bold text-xl">
                        {profile?.full_name
                          ? profile.full_name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
                          : <User className="size-8 text-emerald-400/70" />}
                      </div>
                    )}

                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center gap-1 z-10 backdrop-blur-xs">
                        <Loader2 className="size-5 text-emerald-400 animate-spin" />
                        <span className="text-[8px] font-mono text-emerald-300">Uploading</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-900 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-md hover:scale-110 cursor-pointer disabled:opacity-50"
                    title="Change profile picture"
                  >
                    <Camera className="size-3.5" />
                  </button>
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Avatar</span>
                    {profile?.avatar_url && (
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Custom</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    PNG, JPG, WEBP, HEIC (max 5MB)
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors underline cursor-pointer disabled:opacity-50"
                    >
                      {profile?.avatar_url ? 'Change photo' : 'Upload photo'}
                    </button>
                    {profile?.avatar_url && (
                      <>
                        <span className="text-slate-700">•</span>
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                          className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors underline cursor-pointer disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/heic,image/heif"
                  onChange={handleAvatarFileSelect}
                  className="hidden"
                />
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-5 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label htmlFor="page-display-name" className="text-[10px] font-mono text-slate-600 uppercase font-bold">Display Name</label>
                    <input id="page-display-name" value={editForm.full_name} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} className="form-input" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="page-college" className="text-[10px] font-mono text-slate-600 uppercase font-bold">College</label>
                      <input id="page-college" value={editForm.college ?? ''} onChange={(e) => setEditForm({...editForm, college: e.target.value})} className="form-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="page-branch" className="text-[10px] font-mono text-slate-600 uppercase font-bold">Branch</label>
                      <input id="page-branch" value={editForm.branch ?? ''} onChange={(e) => setEditForm({...editForm, branch: e.target.value})} className="form-input" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="page-batch-year" className="text-[10px] font-mono text-slate-600 uppercase font-bold">Batch Year</label>
                      <input id="page-batch-year" value={editForm.year ?? ''} onChange={(e) => setEditForm({...editForm, year: e.target.value})} className="form-input" />
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
                      <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-900/50 hover:border-slate-700/50 transition-all group">
                        <item.icon className="size-4 text-emerald-500/40 group-hover:text-emerald-500/60 transition-colors" />
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
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-center hover:border-emerald-500/30 transition-all group cursor-default">
                <p className="text-2xl font-bold text-white font-mono">{registrations.length}</p>
                <p className="text-[9px] font-mono text-slate-500 uppercase group-hover:text-emerald-500/80 transition-colors">Total RSVPs</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-center hover:border-emerald-500/30 transition-all group cursor-default">
                <p className="text-2xl font-bold text-white font-mono group-hover:scale-110 transition-transform">{upcomingCount}</p>
                <p className="text-[9px] font-mono text-slate-500 uppercase group-hover:text-emerald-500/80 transition-colors">Upcoming</p>
              </div>
            </div>
          </Card>

          {/* Academic Notes Vault Quick Card */}
          <Card className="p-8 border-slate-800 bg-cyan-500/5 space-y-4 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-cyan-400">
                Academic Notes Vault
              </h2>
              <span className="text-[10px] font-mono text-cyan-300 uppercase bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                PDFs
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Access verified lecture handbooks, exam formulas, and syllabus modules uploaded by organizers.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/notes')}
                className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 font-mono text-xs"
              >
                Open Notes Section
              </Button>
              <Link href="/notes" className="w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-slate-400 hover:text-white font-mono text-xs"
                >
                  Visit Dedicated Notes Portal →
                </Button>
              </Link>
            </div>
          </Card>
        </div>

{/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
              <h2 className="text-2xl font-extrabold text-white font-mono uppercase tracking-tight">Your Learning Path</h2>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/events/archive" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-mono mr-2">
                View Archive →
              </Link>
              <Link href="/events"><Button variant="ghost" size="sm" className="font-bold">Explore Sprints <ArrowUpRight className="ml-2 size-4" /></Button></Link>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === 'upcoming'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              Upcoming
              <span className="absolute top-1 right-2 text-[10px] font-mono opacity-70">
                {registrations.filter(reg => new Date(reg.events.date) >= currentDate).length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === 'completed'
                  ? 'bg-slate-800 text-white border border-slate-600'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              Completed
              <span className="absolute top-1 right-2 text-[10px] font-mono opacity-70">
                {registrations.filter(reg => new Date(reg.events.date) < currentDate).length}
              </span>
            </button>
          </div>

          {filteredRegistrations.length > 0 ? (
            <div className="space-y-4">
              {filteredRegistrations.map((reg) => {
                const ev = reg.events;
                const isUpcoming = new Date(ev.date) >= currentDate;

                return (
                  <RegistrationCard
                    key={reg.id}
                    reg={reg}
                    isUpcoming={isUpcoming}
                    handleCancelRegistration={handleCancelRegistration}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyStateCard activeTab={activeTab} />
          )}
        </div>

      </div>

    </div>
  );
}
