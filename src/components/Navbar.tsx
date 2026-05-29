'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Terminal, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/Button';
import { createClient } from '@/utils/supabase/client';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const pathname = usePathname();
  const router = useRouter();

  // Highlight admin navigation separately if inside admin portal
  const isAdminPath = pathname?.startsWith('/admin');

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Events', href: '/events' },
    { label: 'Register', href: '/register' },
    ...(isAdminPath ? [{ label: 'Admin Panel', href: '/admin/dashboard' }] : []),
  ];

  const isActive = (href: string) => pathname === href;

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
        } else {
          setUser(null);
          setProfile(null);
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

    return () => {
      subscription.unsubscribe();
    };
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
      return profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'CC';
  };

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClose = () => setDropdownOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [dropdownOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-500/10 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 group-hover:border-emerald-500/70 transition-all duration-300">
                <Terminal className="h-5 w-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              </div>
              <span className="font-mono text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Campus<span className="text-emerald-500 font-sans">Coder</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-emerald-400 relative py-1 ${
                  isActive(link.href) ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                )}
              </Link>
            ))}
          </nav>

          {/* User actions */}
          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-800 animate-pulse" />
            ) : user ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 font-mono text-xs font-bold text-emerald-400 focus:outline-none transition-all cursor-pointer"
                >
                  {getInitials()}
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-800 bg-slate-950 p-2 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-3 py-2 border-b border-slate-900">
                      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate mt-0.5">{profile?.full_name || 'Member'}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      {profile?.role && (
                        <span className="inline-flex mt-1.5 items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono font-medium text-emerald-400 border border-emerald-500/20 capitalize">
                          {profile.role}
                        </span>
                      )}
                    </div>
                    <div className="py-1">
                      {(profile?.role === 'admin' || profile?.role === 'organizer') && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-900 hover:text-emerald-400 transition-colors"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5" /> Admin Dashboard
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-slate-900 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {!isAdminPath && (
                  <Link href="/admin/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors mr-2">
                    Admin
                  </Link>
                )}
                <Link href="/login">
                  <Button variant="secondary" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">
                    Join Community
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-900 hover:text-emerald-400 focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-emerald-500/10 bg-slate-950/95 backdrop-blur-lg">
          <div className="space-y-1 px-4 py-4 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-emerald-400'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-emerald-500/10 flex flex-col gap-3">
              {loading ? (
                <div className="h-8 w-full bg-slate-900 border border-slate-800 animate-pulse rounded" />
              ) : user ? (
                <>
                  <div className="px-3 py-2 border-b border-slate-900/60">
                    <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Signed in as</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{profile?.full_name || 'Member'}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    {profile?.role && (
                      <span className="inline-flex mt-1.5 items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono font-medium text-emerald-400 border border-emerald-500/20 capitalize">
                        {profile.role}
                      </span>
                    )}
                  </div>
                  {(profile?.role === 'admin' || profile?.role === 'organizer') && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 rounded px-3 py-2 text-base text-slate-300 hover:text-emerald-400 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-base text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> Log Out
                  </button>
                </>
              ) : (
                <>
                  {!isAdminPath && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="px-3 py-2 text-base text-slate-400 hover:text-white"
                    >
                      Admin Portal
                    </Link>
                  )}
                  <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
                    <Button variant="secondary" size="md" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsOpen(false)} className="w-full">
                    <Button variant="primary" size="md" className="w-full">
                      Join Community
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
