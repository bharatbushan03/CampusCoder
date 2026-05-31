'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Terminal, KeyRound, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';

type ProfileRole = Pick<Database['public']['Tables']['profiles']['Row'], 'role'>;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setIsSubmitting(false);
        return;
      }

      if (data?.user) {
        // Fetch role from profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
          .returns<ProfileRole>();

        if (profileError || !profile) {
          // If no profile exists yet, redirect to home
          router.push('/');
          router.refresh();
          return;
        }

        if (profile.role === 'admin' || profile.role === 'organizer') {
          router.push('/admin');
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(message);
      setIsSubmitting(false);
    }
  };


  return (
    <div className="tech-grid min-h-screen flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-md">
        
        {/* Logo/Branding Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Terminal className="size-5 text-emerald-400" />
            </div>
            <span className="font-mono text-xl font-bold tracking-tight text-white">
              Campus<span className="text-emerald-500 font-sans">Coder</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white">Sign In to Your Workspace</h1>
          <p className="text-xs text-slate-400 mt-1">Access events management and member dashboard.</p>
        </div>

        {/* Login Card */}
        <Card hoverEffect={false} className="border-emerald-500/10 p-8">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg mb-6">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email field */}
            <div>
              <label htmlFor="page-email-address" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input id="page-email-address"
                  type="email"
                  required
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="page-password" className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-emerald-400 hover:text-emerald-300">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input id="page-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Authorizing&hellip;
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Prompt to register */}
          <div className="text-center mt-6 pt-6 border-t border-slate-900">
            <p className="text-xs text-slate-400">
              New to CampusCoder?{' '}
              <Link href="/signup" className="text-emerald-400 hover:underline">
                Create an account &rarr;
              </Link>
            </p>
          </div>
        </Card>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-400">
            &larr; Back to landing page
          </Link>
        </div>

      </div>
    </div>
  );
}
