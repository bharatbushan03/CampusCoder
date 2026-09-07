'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Terminal,
  KeyRound,
  Mail,
  ArrowRight,
  Loader2,
  User,
  School,
  BookOpen,
  CalendarCheck,
  MailCheck,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sendSignupOtp, verifySignupOtp, resendOtp, user, profile, loading: authLoading } = useAuth();

  const redirectParam = searchParams ? searchParams.get('redirect') || searchParams.get('from') : null;

  // Form State (Step 1)
  const COLLEGES = ['MIET'];
  const BRANCHES = [
    'AIML',
    'Cyber Security',
    'ECE',
    'CSE'
  ];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState(COLLEGES[0]);
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('2027');

  // Flow State
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // If already authenticated, redirect to appropriate destination
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

  // Resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  // Step 1: Send OTP
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password || !fullName || !college || !branch) {
      setErrorMsg('Please fill out all required fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      await sendSignupOtp({
        email: cleanEmail,
        password,
        fullName: fullName.trim(),
        college: college.trim(),
        branch: branch.trim(),
        year,
      });

      setStep('otp');
      setResendCooldown(60);
      setSuccessMsg('Verification code sent to your email!');
      // Focus first OTP input
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numbers
    const cleanVal = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      // User pasted multiple digits
      const pasted = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
    } else {
      newDigits[index] = cleanVal;
      setOtpDigits(newDigits);
      if (cleanVal && index < 5) {
        otpInputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setOtpDigits(newDigits);
    const nextIndex = Math.min(pasteData.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredOtp = otpDigits.join('').trim();
    if (enteredOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const verifiedProfile = await verifySignupOtp(cleanEmail, enteredOtp);

      setSuccessMsg('Account verified successfully! Redirecting...');
      setTimeout(() => {
        if (redirectParam && redirectParam.startsWith('/')) {
          router.push(redirectParam);
        } else if (verifiedProfile?.role === 'admin' || verifiedProfile?.role === 'organizer') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }, 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid verification code. Please try again.';
      setErrorMsg(message);
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsResending(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      await resendOtp(cleanEmail, 'signup');
      setResendCooldown(60);
      setSuccessMsg('A fresh verification code was sent to your email.');
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code.';
      setErrorMsg(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="tech-grid min-h-screen flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-lg">
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
            {step === 'form' ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {step === 'form'
              ? 'Join the community, participate in workshops, and showcase projects.'
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {/* Signup Card */}
        <Card hoverEffect={false} className="border-emerald-500/10 p-8">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg mb-6 font-mono">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-lg mb-6 font-mono flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 'form' ? (
            /* STEP 1: Registration Form */
            <form onSubmit={handleInitiateSignup} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="page-full-name"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <input
                      id="page-full-name"
                      type="text"
                      required
                      placeholder="Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Email field */}
                <div>
                  <label
                    htmlFor="page-college-email"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2"
                  >
                    College Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <input
                      id="page-college-email"
                      type="email"
                      required
                      placeholder="name@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password field */}
                <div>
                  <label
                    htmlFor="page-password"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <input
                      id="page-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Graduation Year */}
                <div>
                  <label
                    htmlFor="page-graduation-year"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2"
                  >
                    Graduation Year
                  </label>
                  <div className="relative">
                    <CalendarCheck className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <select
                      id="page-graduation-year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                    >
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                      <option value="2030">2030</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* College */}
                <div>
                  <label
                    htmlFor="page-college-name"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2"
                  >
                    College Name
                  </label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <select
                      id="page-college-name"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                    >
                      {COLLEGES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Branch */}
                <div>
                  <label
                    htmlFor="page-branch-department"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2"
                  >
                    Branch/Department
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <select
                      id="page-branch-department"
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                    >
                      <option value="">Select your branch</option>
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
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
                      <Loader2 className="size-4 animate-spin" /> Sending verification code...
                    </>
                  ) : (
                    <>
                      Get Verification Code <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* STEP 2: OTP Verification */
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center py-2">
                <div className="inline-flex items-center justify-center size-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
                  <MailCheck className="size-7" />
                </div>
                <p className="text-xs text-slate-300">
                  We sent a 6-digit verification code to:
                </p>
                <p className="font-mono text-sm font-semibold text-emerald-400 mt-0.5">{email}</p>
              </div>

              {/* 6 Digit Inputs */}
              <div>
                <label className="block text-center text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                  Enter 6-Digit Code
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputsRef.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="size-11 sm:size-12 text-center font-mono text-lg sm:text-xl font-bold bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isSubmitting || otpDigits.join('').length !== 6}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Verifying & Signing In...
                    </>
                  ) : (
                    <>
                      Verify & Complete Sign Up <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <ArrowLeft className="size-3.5" /> Edit details
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isResending}
                    className={`inline-flex items-center gap-1.5 font-mono ${
                      resendCooldown > 0 || isResending
                        ? 'text-slate-500 cursor-not-allowed'
                        : 'text-emerald-400 hover:text-emerald-300 hover:underline'
                    }`}
                  >
                    <RotateCcw className={`size-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Prompt to login */}
          <div className="text-center mt-6 pt-6 border-t border-slate-900">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-400 hover:underline">
                Sign in instead &rarr;
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
