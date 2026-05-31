'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Terminal, KeyRound, Mail, ArrowRight, Loader2, User, School, BookOpen, CalendarCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('2027');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !college || !branch) {
      setErrorMsg('Please fill out all required fields.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            college: college,
            branch: branch,
            year: year,
            role: 'student', // Default role
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setIsSubmitting(false);
        return;
      }

      if (data?.user) {
        // If email confirmation is enabled, user session might be null initially
        if (data.session) {
          setSuccessMsg('Account created successfully! Redirecting&hellip;');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 1500);
        } else {
          setSuccessMsg('Registration successful! Please check your email for a confirmation link.');
          setIsSubmitting(false);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(message);
      setIsSubmitting(false);
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
          <h1 className="text-xl font-bold text-white font-mono">Create Student Profile</h1>
          <p className="text-xs text-slate-400 mt-1">Join the campus developer ecosystem and start sprint trackings.</p>
        </div>

        {/* Signup Card */}
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

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label htmlFor="page-full-name" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input id="page-full-name"
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
                <label htmlFor="page-college-email" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  College Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input id="page-college-email"
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
                <label htmlFor="page-password" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Password
                </label>
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

              {/* Graduation Year */}
              <div>
                <label htmlFor="page-graduation-year" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Graduation Year
                </label>
                <div className="relative">
                  <CalendarCheck className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <select id="page-graduation-year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                  >
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                    <option value="2029">2029</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* College */}
              <div>
                <label htmlFor="page-college-name" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  College Name
                </label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input id="page-college-name"
                    type="text"
                    required
                    placeholder="e.g. CEC Delhi"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Branch */}
              <div>
                <label htmlFor="page-branch-department" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Branch/Department
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input id="page-branch-department"
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
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
                    <Loader2 className="size-4 animate-spin" /> Registering&hellip;
                  </>
                ) : (
                  <>
                    Sign Up <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

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
            &larr; Back to landing page
          </Link>
        </div>

      </div>
    </div>
  );
}
