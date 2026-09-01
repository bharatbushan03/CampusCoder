'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Menu, X, LogOut, LayoutDashboard, ShieldAlert, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '@/lib/auth';

const navLinks = [
  { label: 'Sprints', href: '/events' },
  { label: 'Workshops', href: '/workshops' },
  { label: 'Resources', href: '/resources' },
  { label: 'Showcase', href: '/showcase' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'About', href: '/about' },
  { label: 'Archive', href: '/events/archive' },
];

export const Navbar: React.FC = React.memo(function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { user, profile, loading, logout } = useAuth();

  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
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
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-200 border-b ${
        scrolled 
          ? 'bg-[#080b11]/90 backdrop-blur-xl border-white/[0.08] py-1' 
          : 'bg-[#080b11]/75 backdrop-blur-md border-white/[0.05] py-1.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div 
                whileHover={{ rotate: 4, scale: 1.03 }}
                className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/25 group-hover:border-emerald-500/50 transition-all"
              >
                <Terminal className="size-4 text-emerald-400" />
              </motion.div>
              <span className="font-mono text-base font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors hidden sm:block">
                Campus<span className="text-emerald-400 font-sans font-semibold">Coder</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-[#0e1422] px-2 py-1 rounded-xl border border-white/[0.07] overflow-x-auto max-w-[50vw] lg:max-w-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-[11px] font-semibold px-3 py-1 rounded-lg transition-all font-mono uppercase tracking-wider ${
                  isActive(link.href) 
                    ? 'text-emerald-300' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive(link.href) && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-[#172033] border border-white/[0.1] rounded-lg shadow-sm"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-2.5">
            {loading ? (
              <div className="size-7 rounded-full bg-white/[0.05] animate-pulse" />
            ) : user ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <motion.button 
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-lg bg-[#0e1422] border border-white/[0.08] hover:border-white/[0.16] transition-all cursor-pointer"
                >
                  <div className="size-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-mono text-[10px] font-bold text-emerald-400">
                    {getInitials()}
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 hidden lg:block">{profile?.full_name?.split(' ')[0] || 'Coder'}</span>
                  <ChevronDown className={`size-3 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </motion.button>
                
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2.5 w-60 rounded-xl border border-white/[0.09] bg-[#0e1422] p-1.5 shadow-2xl z-[70]"
                    >
                      <div className="px-3 py-2.5 border-b border-white/[0.07] mb-1">
                        <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Member'}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
                        {profile?.role && (
                          <span className="inline-flex mt-1.5 items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400 border border-emerald-500/20 uppercase">
                            {profile.role}
                          </span>
                        )}
                      </div>
                      
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white transition-all"
                      >
                        <LayoutDashboard className="size-3.5 text-slate-400" /> My Dashboard
                      </Link>
                      
                      {(profile?.role === 'admin' || profile?.role === 'organizer') && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white transition-all"
                        >
                          <ShieldAlert className="size-3.5 text-slate-400" /> Admin Console
                        </Link>
                      )}

                      <div className="border-t border-white/[0.07] mt-1 pt-1">
                        <button type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        >
                          <LogOut className="size-3.5 text-red-400" /> Log Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:block">
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">Join Community</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button 
              type="button"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setIsOpen(!isOpen)}
              className="flex md:hidden size-9 items-center justify-center rounded-lg bg-[#0e1422] border border-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isOpen ? 'close' : 'menu'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
                </motion.div>
              </AnimatePresence>
            </button>
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
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden border-t border-white/[0.07] bg-[#080b11]/98 backdrop-blur-xl overflow-hidden"
          >
            <div className="space-y-1 px-4 py-5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold transition-all ${
                    isActive(link.href)
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-white/[0.07] mt-3">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Login</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">Join</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
});