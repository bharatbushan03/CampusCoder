'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Terminal, CheckCircle2, ArrowRight, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';
import { placeholderEvents } from '@/lib/placeholderData';
import Link from 'next/link';
import { registerForEvent } from '@/app/actions/registrationActions';
import { registrationSchema } from '@/lib/validation';

function RegisterForm() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams ? searchParams.get('eventId') : null;

  const [events, setEvents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: 'Campus Engineering College',
    branch: 'Computer Science',
    year: '2027',
    eventId: initialEventId || '',
    codingLevel: 'Intermediate',
    preferredLanguage: 'JavaScript/TypeScript',
    reasonToJoin: '',
    consent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDbOffline, setIsDbOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const codingLevels = ['Beginner', 'Intermediate', 'Advanced'];
  const programmingLanguages = ['JavaScript/TypeScript', 'Python', 'C/C++', 'Java', 'Go/Rust'];

  // Fetch available events for dropdown selection
  useEffect(() => {
    async function loadEvents() {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from('events')
          .select('id, title, date, start_time, end_time')
          .eq('status', 'published');

        if (error) throw error;

        if (data && data.length > 0) {
          setEvents(data);
          if (!formData.eventId) {
            setFormData(prev => ({ ...prev, eventId: (data as any[])[0].id }));
          }
        } else {
          // If query succeeds but returns empty
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase-project')) {
            setEvents(placeholderEvents);
            if (!formData.eventId) {
              setFormData(prev => ({ ...prev, eventId: placeholderEvents[0].id }));
            }
          }
        }
      } catch (err: any) {
        console.warn('Database offline, using static options for registration dropdown');
        setIsDbOffline(true);
        setEvents(placeholderEvents);
        if (!formData.eventId) {
          setFormData(prev => ({ ...prev, eventId: placeholderEvents[0].id }));
        }
      }
    }

    loadEvents();
  }, [initialEventId, formData.eventId]);

  const selectedEvent = events.find((e) => e.id === formData.eventId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = registrationSchema.safeParse(formData);
    if (!validation.success) {
      setErrorMsg(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await registerForEvent(formData, formData.eventId);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card hoverEffect={false} className="max-w-xl mx-auto p-10 border-emerald-500/30 bg-slate-900 text-center glow-box">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Registration Successful!</h2>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Awesome, {formData.fullName}! We have saved your registration. A calendar invite and session link will be sent to{' '}
          <span className="text-emerald-400 font-mono">{formData.email}</span> shortly.
        </p>

        {selectedEvent && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 text-left mb-8 max-w-md mx-auto">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">RSVP Event</p>
            <p className="text-sm font-bold text-white mt-1">{selectedEvent.title}</p>
            <p className="text-xs text-emerald-400 font-mono mt-1">
              {selectedEvent.date} @ {selectedEvent.start_time ? `${selectedEvent.start_time.slice(0, 5)} - ${selectedEvent.end_time.slice(0, 5)}` : 'Schedule listed on Details'}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-sm mx-auto">
          <Link href="/events" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">
              Explore More Events
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full text-slate-300">
              Return Home
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card hoverEffect={false} className="max-w-2xl mx-auto p-8 border-emerald-500/10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Terminal className="h-5 w-5 text-emerald-400" /> Event Registration
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Complete your information to reserve a seat at this technical workshop or sprint session.
        </p>
      </div>

      {isDbOffline && (
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-emerald-500/10 rounded-xl mb-6 text-xs text-slate-400">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>Local Demo Mode: connect Supabase to save real registrations.</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg mb-6">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
              Full Name <span className="text-emerald-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
              College Email <span className="text-emerald-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. rahul@college.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phone Number */}
          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
              Contact Phone <span className="text-emerald-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Graduation Year */}
          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
              Graduation Year
            </label>
            <select
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            >
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* College Name */}
          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
              College/Institute Name <span className="text-emerald-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Branch/Stream */}
          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
              Department/Branch <span className="text-emerald-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Select Event */}
        <div>
          <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
            Select Sprint Event <span className="text-emerald-500">*</span>
          </label>
          <select
            value={formData.eventId}
            onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            required
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({new Date(ev.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coding Level */}
          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
              My Coding Level
            </label>
            <select
              value={formData.codingLevel}
              onChange={(e) => setFormData({ ...formData, codingLevel: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            >
              {codingLevels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
              Preferred Language
            </label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            >
              {programmingLanguages.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reason for joining */}
        <div>
          <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
            Why do you want to join this session?
          </label>
          <textarea
            placeholder="Describe your learning objectives..."
            value={formData.reasonToJoin}
            onChange={(e) => setFormData({ ...formData, reasonToJoin: e.target.value })}
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          ></textarea>
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            required
            id="general-consent"
            checked={formData.consent}
            onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
            className="mt-1 h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
          />
          <label htmlFor="general-consent" className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none">
            I agree to receive event updates from CampusCoder. <span className="text-emerald-500">*</span>
          </label>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Processing RSVP...
              </>
            ) : (
              <>
                Confirm Community RSVP <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function RegistrationPage() {
  return (
    <div className="tech-grid min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb back */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Home
        </Link>

        {/* Wrap in Suspense to resolve searchParams */}
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          </div>
        }>
          <RegisterForm />
        </Suspense>

      </div>
    </div>
  );
}
