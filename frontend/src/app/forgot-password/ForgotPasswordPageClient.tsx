'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Terminal,
  Mail,
  ArrowRight,
  Loader2,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle Step 1: Send Reset OTP / Link
  const handleSendResetCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      setStep('otp');
      setCooldown(60);
      setSuccessMsg('A 6-digit verification code has been sent to your email.');
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
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
      setSuccessMsg('A fresh verification code has been sent.');
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP digit changes
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

  // Handle Step 2: Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }
    if (!password || !confirmPassword) {
      setErrorMsg('Please enter and confirm your new password.');
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

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp: fullOtp,
          password,
        }),
      });

      setSuccessMsg('Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
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
          <h1 className="text-xl font-bold text-white font-mono">
            {step === 'email' ? 'Reset Your Password' : 'Enter Verification Code'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {step === 'email'
              ? 'Enter your registered email to receive a 6-digit reset code.'
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {/* Card */}
        <Card hoverEffect={false} className="border-emerald-500/10 p-8">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-lg mb-6 font-mono space-y-1.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
              {errorMsg.toLowerCase().includes('no account') && (
                <div className="pt-1 text-[11px] text-slate-300 pl-6">
                  Need an account?{' '}
                  <Link href="/signup" className="text-emerald-400 underline hover:text-emerald-300 font-bold">
                    Sign up now &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-lg mb-6 font-mono flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendResetCode} className="space-y-5">
              {/* Email field */}
              <div>
                <label
                  htmlFor="page-email-address"
                  className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2"
                >
                  Registered Email Address
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
                      <Loader2 className="size-4 animate-spin" /> Sending Code&hellip;
                    </>
                  ) : (
                    <>
                      Send Reset Code <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* 6-Digit OTP Inputs */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 text-center">
                  6-Digit Verification Code
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
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="page-new-pass"
                  className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    id="page-new-pass"
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
                  htmlFor="page-confirm-pass"
                  className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    id="page-confirm-pass"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Resend button */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="size-3" /> Change email
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isSubmitting}
                  className={`inline-flex items-center gap-1 ${
                    cooldown > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-emerald-400 hover:underline cursor-pointer'
                  }`}
                >
                  <RotateCw className={`size-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                  {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
                </button>
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
                      <Loader2 className="size-4 animate-spin" /> Updating Password&hellip;
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" /> Reset Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Prompt to login */}
          <div className="text-center mt-6 pt-6 border-t border-slate-900">
            <p className="text-xs text-slate-400">
              Remember your password?{' '}
              <Link href="/login" className="text-emerald-400 hover:underline">
                Sign in &rarr;
              </Link>
            </p>
          </div>
        </Card>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-400">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
