'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Menu, X, LogOut, LayoutDashboard, ShieldAlert, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { createClient } from '@/utils/supabase/client';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type ProfileSummary = Pick<Database['public']['Tables']['profiles']['Row'], 'role' | 'full_name' | 'email'>;

const navLinks = [
  { label: 'Sprints', href: '/events' },
  { label: 'Workshops', href: '/workshops' },
  { label: 'Resources', href: '/resources' },
  { label: 'About', href: '/about' },
  { label: 'Archive', href: '/events/archive' },
];

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('role, full_name, email')
            .eq('id', session.user.id)
            .returns<ProfileSummary>()
            .single();
          setProfile(userProfile);
        }
      } catch (err) {
        console.warn('Auth session unavailable:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        setUser(session.user);
        try {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('role, full_name, email')
            .eq('id', session.user.id)
            .returns<ProfileSummary>()
            .single();
          setProfile(userProfile);
        } catch (err) {
          console.warn('User profile unavailable:', err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setDropdownOpen(false);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.warn('Signout error:', err);
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
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`sticky top-0 z-50 w-full transition-colors duration-500 border-b ${
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
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:border-emerald-500/50 transition-all"
              >
                <Terminal className="size-5 text-emerald-400" />
              </motion.div>
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
                className={`relative text-xs font-bold px-4 py-1.5 rounded-xl transition-all font-mono uppercase tracking-widest ${
                  isActive(link.href) 
                    ? 'text-emerald-400' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive(link.href) && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="size-8 rounded-full bg-slate-800 animate-pulse" />
            ) : user ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <motion.button 
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all cursor-pointer"
                >
                  <div className="size-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-mono text-[10px] font-bold text-emerald-400">
                    {getInitials()}
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hidden lg:block">{profile?.full_name?.split(' ')[0] || 'Coder'}</span>
                  <ChevronDown className={`size-3 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </motion.button>
                
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-2xl ring-1 ring-emerald-500/10 z-[70]"
                    >
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
                        <LayoutDashboard className="size-4 text-slate-500 group-hover:text-emerald-400" /> My Dashboard
                      </Link>
                      
                      {(profile?.role === 'admin' || profile?.role === 'organizer') && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all group"
                        >
                          <ShieldAlert className="size-4 text-slate-500 group-hover:text-emerald-400" /> Admin Console
                        </Link>
                      )}

                      <div className="border-t border-slate-900 mt-1 pt-1">
                        <button type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs text-red-400 hover:bg-red-500/10 transition-all group cursor-pointer"
                        >
                          <LogOut className="size-4 text-red-500/60 group-hover:text-red-500" /> Log Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
            <motion.button 
              type="button"
              whileTap={{ scale: 0.9 }}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setIsOpen(!isOpen)}
              className="flex md:hidden size-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isOpen ? 'close' : 'menu'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden border-t border-slate-800/40 bg-slate-950/95 backdrop-blur-xl overflow-hidden"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
