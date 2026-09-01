'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Terminal, KeyRound, Mail, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { TechBackground } from '@/components/animations/TechBackground';
import { CampusCoderLoader } from '@/components/ui/CampusCoderLoader';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const redirectParam = searchParams ? searchParams.get('redirect') || searchParams.get('from') : null;

  useEffect(() => {
    if (!authLoading && user) {
      if (redirectParam && redirectParam.startsWith('/')) {
        router.replace(redirectParam);
      } else if (profile?.role === 'admin' || profile?.role === 'organizer') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, profile, authLoading, redirectParam, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const loggedInProfile = await login(cleanEmail, password);
      if (redirectParam && redirectParam.startsWith('/')) {
        router.push(redirectParam);
      } else if (loggedInProfile?.role === 'admin' || loggedInProfile?.role === 'organizer') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-16 px-4 bg-[#080b11]">
      <TechBackground />
      
      <div className="w-full max-w-md relative z-10">
        
        {/* Logo/Branding Header */}
        <div className="text-left mb-6 space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/25">
              <Terminal className="size-4 text-emerald-400" />
            </div>
            <span className="font-mono text-lg font-bold tracking-tight text-white">
              Campus<span className="text-emerald-400 font-sans">Coder</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sign In</h1>
          <p className="text-xs text-slate-400 leading-relaxed">Enter your credentials to access your sprints and dashboard.</p>
        </div>

        {/* Login Card */}
        <Card hover={false} className="border-white/[0.08] bg-[#0e1422] p-6 sm:p-8 shadow-[0_4px_32px_rgba(0,0,0,0.5)]">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-lg mb-5 font-mono">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email field */}
            <div>
              <label htmlFor="page-email-address" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  id="page-email-address"
                  type="email"
                  required
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#080b11] border border-white/[0.08] rounded-lg pl-9 pr-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="page-password" className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-mono text-emerald-400 hover:text-emerald-300">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  id="page-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#080b11] border border-white/[0.08] rounded-lg pl-9 pr-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150"
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                kbd="↵"
                className="w-full font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Authenticating&hellip;
                  </>
                ) : (
                  <>
                    Sign In to Console <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Prompt to register */}
          <div className="mt-6 pt-5 border-t border-white/[0.07] flex items-center justify-between text-xs">
            <span className="text-slate-400">New candidate?</span>
            <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-mono font-semibold">
              Create account &rarr;
            </Link>
          </div>
        </Card>

        {/* Security badge & Back link */}
        <div className="flex items-center justify-between mt-6 px-1 text-xs text-slate-500 font-mono">
          <Link href="/" className="hover:text-slate-300 transition-colors">
            &larr; Back to hub
          </Link>
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="size-3.5 text-emerald-400/70" /> End-to-end verified
          </span>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#080b11]">
        <CampusCoderLoader size="lg" text="Loading login..." />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

