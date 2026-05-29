'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, Calendar, CheckCircle2, Clock, MapPin, 
  ExternalLink, LogOut, Loader2, Edit2, Save, X, 
  AlertTriangle, MessageSquare, ArrowRight, ShieldAlert,
  Terminal, GraduationCap, School, BookOpen
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [communityLinks, setCommunityLinks] = useState<any[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit profile form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    college: '',
    branch: '',
    year: ''
  });

  const loadDashboardData = async () => {
    try {
      const supabase = createClient() as any;
      
      // 1. Get Auth User
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(user);

      // 2. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setEditForm({
        full_name: profileData.full_name || '',
        college: profileData.college || '',
        branch: profileData.branch || '',
        year: profileData.year || ''
      });

      // 3. Fetch Registrations (linked by email)
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .select(`
          *,
          events (*)
        `)
        .eq('email', user.email)
        .order('registered_at', { ascending: false });

      if (regError) throw regError;
      setRegistrations(regData || []);

      // 4. Fetch Community Links
      const { data: linkData, error: linkError } = await supabase
        .from('community_links')
        .select('*')
        .eq('is_active', true);

      if (linkError) throw linkError;
      setCommunityLinks(linkData || []);

    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setErrorMsg('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient() as any;
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile({ ...profile, ...editForm });
      setIsEditingProfile(false);
      setSuccessMsg('Profile updated successfully.');
    } catch (err: any) {
      setErrorMsg('Failed to update profile: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelRegistration = async (regId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to cancel your registration for "${eventTitle}"?`)) return;

    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', regId);

      if (error) throw error;
      
      setRegistrations(registrations.filter(r => r.id !== regId));
      setSuccessMsg(`Cancelled registration for ${eventTitle}.`);
    } catch (err: any) {
      setErrorMsg('Failed to cancel registration: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-400">Loading student console...</p>
        </div>
      </div>
    );
  }

  // Not Logged In View
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[calc(100vh-10rem)]">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="p-4 rounded-full bg-slate-900 border border-slate-800 w-16 h-16 flex items-center justify-center mx-auto shadow-2xl">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white font-mono tracking-tight">Access Denied</h1>
            <p className="text-slate-400 text-sm">Please log in to view your dashboard and manage your registrations.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/login">
              <Button variant="primary" className="w-full">Sign In to Continue</Button>
            </Link>
            <Link href="/events">
              <Button variant="outline" className="w-full">Browse Public Events</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* 1. Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">
            Welcome, <span className="text-emerald-400">{profile?.full_name?.split(' ')[0] || 'Coder'}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2 font-mono">
            <Terminal className="h-3.5 w-3.5" /> ID: {user.id.slice(0, 8)}...
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            className="text-slate-400 border-slate-800 hover:text-red-400 hover:bg-red-400/5 h-10 px-4"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-mono animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="h-4 w-4" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-mono">
          <AlertTriangle className="h-4 w-4" /> {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Profile & Community */}
        <div className="space-y-6">
          
          {/* Profile Card */}
          <Card className="border-slate-800 bg-slate-950/40 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500/10 to-transparent p-6 border-b border-slate-900">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400" /> My Profile
                </h2>
                {!isEditingProfile && (
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Full Name</label>
                    <input 
                      type="text" 
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">College</label>
                    <input 
                      type="text" 
                      value={editForm.college}
                      onChange={(e) => setEditForm({...editForm, college: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Branch</label>
                      <input 
                        type="text" 
                        value={editForm.branch}
                        onChange={(e) => setEditForm({...editForm, branch: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Year</label>
                      <input 
                        type="text" 
                        value={editForm.year}
                        onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="sm" 
                      className="flex-1"
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                      Save
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                      <User className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-white leading-none">{profile?.full_name || 'Coder Name'}</p>
                      <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-slate-900">
                    <div className="flex items-center gap-3 text-slate-400">
                      <School className="h-4 w-4 text-emerald-500/50" />
                      <span className="text-xs">{profile?.college || 'No college set'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <GraduationCap className="h-4 w-4 text-emerald-500/50" />
                      <span className="text-xs">{profile?.branch || 'No branch set'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <BookOpen className="h-4 w-4 text-emerald-500/50" />
                      <span className="text-xs">{profile?.year || 'No year set'} Year</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Community Links */}
          <Card className="border-slate-800 bg-slate-950/40 p-6 space-y-4">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-400" /> Community Channels
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {communityLinks.map((link) => (
                <a 
                  key={link.id} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group"
                >
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-tight">{link.platform}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-500/50 group-hover:text-emerald-400" />
                </a>
              ))}
              {communityLinks.length === 0 && (
                <p className="text-[10px] text-slate-500 font-mono italic">No active links found.</p>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Registrations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-400" /> Registered Sprints
            </h2>
            <Link href="/events">
              <Button variant="outline" size="sm" className="text-xs h-9">
                Find More Sprints <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Button>
            </Link>
          </div>

          {registrations.length > 0 ? (
            <div className="space-y-4">
              {registrations.map((reg) => {
                const event = reg.events;
                const isUpcoming = new Date(event.date) >= new Date();
                const status = event.status; // published, completed, cancelled

                return (
                  <Card key={reg.id} hoverEffect={false} className="border-slate-800 bg-slate-950/20 p-5 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono border uppercase ${
                            status === 'published' ? (isUpcoming ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400') :
                            status === 'completed' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                            'bg-slate-800 border-slate-700 text-slate-500'
                          }`}>
                            {status === 'published' ? (isUpcoming ? 'Upcoming' : 'Happening Soon') : status}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono border border-slate-800 bg-slate-900 text-slate-500 uppercase">
                            Registered on {new Date(reg.registered_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-bold text-white leading-tight mb-1">{event.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                            <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-emerald-500" /> {new Date(event.date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-emerald-500" /> {event.start_time} - {event.end_time}</span>
                            <span className="flex items-center gap-1.5 capitalize"><MapPin className="h-3 w-3 text-emerald-500" /> {event.mode}</span>
                          </div>
                        </div>

                        {status === 'published' && isUpcoming && event.meeting_link && (
                          <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-center justify-between gap-4 animate-in fade-in zoom-in-95">
                            <div className="flex items-center gap-2 min-w-0">
                              <ExternalLink className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                              <p className="text-[11px] text-emerald-400 font-mono truncate">Meeting Link Available!</p>
                            </div>
                            <a href={event.meeting_link} target="_blank" rel="noopener noreferrer">
                              <Button variant="primary" size="sm" className="h-7 text-[10px] font-mono px-3">Join Session</Button>
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row md:flex-col justify-end gap-2 md:w-32">
                        <Link href={`/events/${event.slug}`} className="flex-1">
                          <Button variant="secondary" size="sm" className="w-full text-[11px] h-8">View Hub</Button>
                        </Link>
                        {status === 'published' && isUpcoming && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleCancelRegistration(reg.id, event.title)}
                            className="flex-1 text-[11px] h-8 border-slate-800 text-slate-500 hover:text-red-400 hover:bg-red-400/5 hover:border-red-400/20"
                          >
                            Cancel RSVP
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-900/10 border border-slate-900 rounded-2xl space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
                <Calendar className="h-6 w-6 text-slate-700" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-mono text-slate-400">No event registrations found.</p>
                <p className="text-[11px] text-slate-600 max-w-xs mx-auto">RSVP to an upcoming sprint to see it listed here in your dashboard.</p>
              </div>
              <Link href="/events" className="inline-block pt-2">
                <Button variant="primary" size="sm">Explore Events</Button>
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
