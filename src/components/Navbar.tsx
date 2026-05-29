'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Terminal, Menu, X, LogOut, LayoutDashboard, ShieldAlert, ChevronDown, User, Settings } from 'lucide-react';
import { Button } from './ui/Button';
import { createClient } from '@/utils/supabase/client';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  const isAdminPath = pathname?.startsWith('/admin');

  const navLinks = [
    { label: 'Sprints', href: '/events' },
    { label: 'Workshops', href: '/workshops' },
    { label: 'Resources', href: '/resources' },
    { label: 'Archive', href: '/events/archive' },
  ];

  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient() as any;

    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('role, full_name, email')
            .eq('id', session.user.id)
            .single();
          setProfile(userProfile);
        }
      } catch (err) {
        console.error('Error fetching auth session:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        setUser(session.user);
        try {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('role, full_name, email')
            .eq('id', session.user.id)
            .single();
          setProfile(userProfile);
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient() as any;
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setDropdownOpen(false);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Signout error:', err);
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'CC';
  };

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClose = () => setDropdownOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [dropdownOpen]);

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-slate-950/80 backdrop-blur-xl border-slate-800/60 py-2' 
          : 'bg-transparent border-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:border-emerald-500/50 transition-all">
                <Terminal className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="font-mono text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors hidden sm:block">
                Campus<span className="text-emerald-500 font-sans">Coder</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/40 p-1 rounded-2xl border border-slate-800/40 backdrop-blur-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all font-mono uppercase tracking-widest ${
                  isActive(link.href) 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-slate-800 animate-pulse" />
            ) : user ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all cursor-pointer"
                >
                  <div className="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-mono text-[10px] font-bold text-emerald-400">
                    {getInitials()}
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hidden lg:block">{profile?.full_name?.split(' ')[0] || 'Coder'}</span>
                  <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-2xl ring-1 ring-emerald-500/10 z-[70] animate-in fade-in zoom-in-95 slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-slate-900 mb-1">
                      <p className="text-sm font-bold text-white truncate">{profile?.full_name || 'Member'}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
                      {profile?.role && (
                        <span className="inline-flex mt-2 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-tighter">
                          {profile.role}
                        </span>
                      )}
                    </div>
                    
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all group"
                    >
                      <LayoutDashboard className="h-4 w-4 text-slate-500 group-hover:text-emerald-400" /> My Dashboard
                    </Link>
                    
                    {(profile?.role === 'admin' || profile?.role === 'organizer') && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all group"
                      >
                        <ShieldAlert className="h-4 w-4 text-slate-500 group-hover:text-emerald-400" /> Admin Console
                      </Link>
                    )}

                    <div className="border-t border-slate-900 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs text-red-400 hover:bg-red-500/10 transition-all group cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 text-red-500/60 group-hover:text-red-500" /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">Join Community</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-800/40 bg-slate-950/95 backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-1 px-4 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold font-mono uppercase tracking-widest transition-all ${
                  isActive(link.href)
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-900 mt-4">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="md" className="w-full">Login</Button>
                </Link>
                <Link href="/signup" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" size="md" className="w-full">Join</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
