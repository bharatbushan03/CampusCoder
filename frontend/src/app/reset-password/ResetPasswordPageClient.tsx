'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Terminal,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
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

function getEmailQueryParam(): string {
  if (typeof window === 'undefined') return '';
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('email') || '';
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const token = getRecoveryAccessToken();
    if (token) {
      setAccessToken(token);
    }
    const emailParam = getEmailQueryParam();
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendOtp = async () => {
    if (!email) {
      setErrorMsg('Please enter your email to receive a new code.');
      return;
    }
    if (cooldown > 0 || isSubmitting) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    setOtp(['', '', '', '', '', '']);

    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setCooldown(60);
      setSuccessMsg('A new 6-digit code has been sent to your email.');
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newOtp = [...otp];

    if (cleanVal.length > 1) {
      const pastedDigits = cleanVal.slice(0, 6).split('');
      pastedDigits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedDigits.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = cleanVal;
    setOtp(newOtp);

    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setErrorMsg('Please fill out all fields.');
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

    const fullOtp = otp.join('');

    if (!accessToken && fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }
    if (!accessToken && !email) {
      setErrorMsg('Please provide your email address.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          password,
          accessToken: accessToken || undefined,
          email: email ? email.trim().toLowerCase() : undefined,
          otp: fullOtp.length === 6 ? fullOtp : undefined,
        }),
      });

      setSuccessMsg('Your password has been successfully updated. Redirecting to login...');
      setIsSubmitting(false);

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
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
          <h1 className="text-xl font-bold text-white font-mono">Set New Password</h1>
          <p className="text-xs text-slate-400 mt-1">
            {accessToken
              ? 'Enter your new secure password below.'
              : 'Enter the 6-digit code sent to your email and your new password.'}
          </p>
        </div>

        {/* Reset Password Card */}
        <Card hoverEffect={false} className="border-emerald-500/10 p-8">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg mb-6 font-mono flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-lg mb-6 font-mono flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!successMsg ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {!accessToken && (
                <>
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="page-email"
                      className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2"
                    >
                      Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                      <input
                        id="page-email"
                        type="email"
                        required
                        placeholder="name@college.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* 6-Digit OTP */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 text-center">
                      6-Digit Code
                    </label>
                    <div className="flex justify-between gap-2">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputsRef.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-11 h-12 text-center text-lg font-mono font-bold text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        />
                      ))}
                    </div>

                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={cooldown > 0 || isSubmitting}
                        className={`text-xs font-mono inline-flex items-center gap-1 ${
                          cooldown > 0
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-emerald-400 hover:underline cursor-pointer'
                        }`}
                      >
                        <RotateCw className={`size-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                        {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* New Password */}
              <div>
                <label
                  htmlFor="page-new-password"
                  className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    id="page-new-password"
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
                <label
                  htmlFor="page-confirm-new-password"
                  className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    id="page-confirm-new-password"
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
                      <ShieldCheck className="size-4" /> Save New Password
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

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href="/login" className="text-xs text-slate-500 hover:text-slate-400">
            &larr; Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
