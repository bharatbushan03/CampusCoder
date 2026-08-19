'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Terminal, KeyRound, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

function getRecoveryAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.slice(1));
  return params.get('access_token') || params.get('token');
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMsg('Please fill out both fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    const accessToken = getRecoveryAccessToken();
    if (!accessToken) {
      setErrorMsg('This password reset link is invalid or expired. Please request a new one.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ password, accessToken }),
      });

      setSuccessMsg('Your password has been successfully updated.');
      setIsSubmitting(false);

      setTimeout(() => {
        router.push('/login');
      }, 2000);
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
          <h1 className="text-xl font-bold text-white font-mono">Create New Password</h1>
          <p className="text-xs text-slate-400 mt-1">Enter your new secure password below.</p>
        </div>

        {/* Reset Password Card */}
        <Card hoverEffect={false} className="border-emerald-500/10 p-8">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg mb-6 font-mono">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-lg mb-6 font-mono">
              {successMsg}
            </div>
          )}

          {!successMsg ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* New Password */}
              <div>
                <label htmlFor="page-new-password" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input id="page-new-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="page-confirm-new-password" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input id="page-confirm-new-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                      <Loader2 className="size-4 animate-spin" /> Updating&hellip;
                    </>
                  ) : (
                    <>
                      Update Password <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto mb-4">
                <CheckCircle2 className="size-6 text-emerald-400" />
              </div>
              <p className="text-sm text-slate-300 mb-6">
                Password updated successfully. Redirecting you to login&hellip;
              </p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

