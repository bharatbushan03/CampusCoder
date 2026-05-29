'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code, Menu, X, Terminal, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Highlight admin navigation separately if inside admin portal
  const isAdminPath = pathname?.startsWith('/admin');

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Events', href: '/events' },
    { label: 'Register', href: '/register' },
    ...(isAdminPath ? [{ label: 'Admin Panel', href: '/admin/dashboard' }] : []),
  ];

  const isActive = (href: string) => pathname === href;

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
            {!isAdminPath && (
              <Link href="/admin/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
                Admin
              </Link>
            )}
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Join Community
              </Button>
            </Link>
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
              <Link href="/register" onClick={() => setIsOpen(false)} className="w-full">
                <Button variant="primary" size="md" className="w-full">
                  Join Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
