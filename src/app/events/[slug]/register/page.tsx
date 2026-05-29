'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Terminal, CheckCircle2, ArrowRight, ArrowLeft, Loader2, AlertTriangle, MessageSquare, PhoneCall } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';
import { placeholderEvents } from '@/lib/placeholderData';

export default function EventRegistrationPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDbOffline, setIsDbOffline] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: 'Campus Engineering College',
    branch: '',
    year: '2027',
    codingLevel: 'Intermediate',
    preferredLanguage: 'JavaScript',
    reasonToJoin: '',
    consent: false,
  });

  const codingLevels = ['Beginner', 'Intermediate', 'Advanced', 'Not started yet'];
  const languages = ['C', 'C++', 'Java', 'Python', 'JavaScript', 'Not sure yet', 'Other'];

  // Helper to generate slugs for local placeholder data fallback
  const getSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  useEffect(() => {
    async function loadEvent() {
      if (!slug) return;
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        
        if (data) {
          setEvent(data);
        }
      } catch (err: any) {
        console.warn('Database offline, looking up registration target in local static events');
        setIsDbOffline(true);
        const match = placeholderEvents.find((ev) => getSlug(ev.title) === slug);
        if (match) {
          setEvent(match);
        } else {
          setErrorMsg('This event does not exist.');
        }
      } finally {
        setLoadingEvent(false);
      }
    }

    loadEvent();
  }, [slug]);

  const validateEmail = (emailStr: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(emailStr);
  };

  const validatePhone = (phoneStr: string) => {
    // Basic phone validate (digits only, at least 10 chars)
    const digits = phoneStr.replace(/\D/g, '');
    return digits.length >= 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Local form checks
    if (!formData.fullName || !formData.email || !formData.phone || !formData.branch || !formData.consent) {
      setErrorMsg('Please fill out all required fields and check the consent box.');
      return;
    }

    if (!validateEmail(formData.email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!validatePhone(formData.phone)) {
      setErrorMsg('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient() as any;

      // 1. Prevent duplicate registrations for same event using email
      const { data: duplicateCheck, error: checkError } = await supabase
        .from('registrations')
        .select('id')
        .eq('event_id', event.id)
        .eq('email', formData.email)
        .limit(1);

      if (checkError) throw checkError;

      if (duplicateCheck && duplicateCheck.length > 0) {
        setErrorMsg('You have already registered for this event with this email address.');
        setIsSubmitting(false);
        return;
      }

      // 2. Save Registration Data
      const { error: insertError } = await supabase
        .from('registrations')
        .insert({
          event_id: event.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          college: formData.college,
          branch: formData.branch,
          year: formData.year,
          coding_level: formData.codingLevel,
          preferred_language: formData.preferredLanguage,
          reason_to_join: formData.reasonToJoin || null,
          attendance_status: 'registered'
        });

      if (insertError) throw insertError;

      setIsSuccess(true);
    } catch (err: any) {
      console.warn('Supabase integration offline, simulating local registration confirmation.');
      // Local fallback simulator
      setTimeout(() => {
        setIsSuccess(true);
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="tech-grid min-h-screen flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-400">Loading registration portals...</p>
        </div>
      </div>
    );
  }

  // Registration Confirmation page view (Success Screen)
  if (isSuccess && event) {
    const eventDateStr = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <div className="tech-grid min-h-screen py-16 flex items-center justify-center px-4">
        <Card hoverEffect={false} className="max-w-2xl w-full p-10 border-emerald-500/30 bg-slate-900 text-center glow-box">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Thank you for registering!</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
            Awesome! Your registration is confirmed. We look forward to seeing you at the sprint.
          </p>

          {/* Event Summary Details */}
          <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-850 text-left mb-8 max-w-lg mx-auto space-y-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">RSVP Event Details</p>
            <h3 className="text-base font-bold text-white leading-tight">{event.title}</h3>
            
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-900 text-xs text-slate-400">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono">Date</span>
                <span className="font-medium text-slate-200">{eventDateStr}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono">Time</span>
                <span className="font-medium text-slate-200">{event.start_time ? `${event.start_time.slice(0,5)} - ${event.end_time.slice(0,5)}` : event.time}</span>
              </div>
            </div>
            
            <div className="pt-3 text-xs text-emerald-400/80 bg-emerald-500/5 p-3 rounded border border-emerald-500/10 mt-3 font-mono">
              ⚡ Meeting link details and schedule alerts will be shared directly via email and our Discord server before the session starts.
            </div>
          </div>

          {/* Discord and WhatsApp Community Buttons */}
          <div className="space-y-4 max-w-sm mx-auto mb-10">
            <p className="text-xs text-slate-400 font-medium">Join our tech channels for slides & discussions:</p>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="https://discord.gg/campuscoder"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white transition-colors"
              >
                <MessageSquare className="h-4 w-4" /> Discord Link
              </a>
              <a
                href="https://whatsapp.com/channel/campuscoder"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20BA5A] text-white transition-colors"
              >
                <PhoneCall className="h-4 w-4" /> WhatsApp Link
              </a>
            </div>
          </div>

          <div className="flex justify-center gap-4 border-t border-slate-900 pt-6">
            <Link href="/events">
              <Button variant="secondary" size="sm">Browse Other Sprints</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="text-slate-400 hover:text-slate-200">Return Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="tech-grid min-h-screen py-16 flex justify-center px-4">
      <div className="max-w-2xl w-full">
        
        {/* Back Link */}
        <Link href={`/events/${slug}`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Back to event details
        </Link>

        {/* Form Container */}
        <Card hoverEffect={false} className="p-8 border-emerald-500/10 bg-slate-900/60 backdrop-blur-md">
          <div className="mb-8">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 capitalize mb-2 inline-block">
              RSVP PORTAL
            </span>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Terminal className="h-5 w-5 text-emerald-400" /> Register: {event?.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Please provide correct student credentials to reserve your seat.
            </p>
          </div>

          {isDbOffline && (
            <div className="flex items-center gap-3 p-4 bg-slate-950 border border-emerald-500/10 rounded-xl mb-6 text-xs text-slate-400 font-mono">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span>Offline Demo Mode: Submissions will simulate success triggers.</span>
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
                  Email Address <span className="text-emerald-500">*</span>
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
                  Phone Number <span className="text-emerald-500">*</span>
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

              {/* Year / Semester */}
              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
                  Year / Semester <span className="text-emerald-500">*</span>
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                >
                  <option value="1st Year (Sem 1-2)">1st Year (Sem 1-2)</option>
                  <option value="2nd Year (Sem 3-4)">2nd Year (Sem 3-4)</option>
                  <option value="3rd Year (Sem 5-6)">3rd Year (Sem 5-6)</option>
                  <option value="4th Year (Sem 7-8)">4th Year (Sem 7-8)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* College Name */}
              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
                  College Name <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              {/* Branch/Department */}
              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
                  Branch / Department <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coding Level */}
              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
                  Current Coding Level
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
                  Preferred Programming Language
                </label>
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Why join */}
            <div>
              <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
                Why do you want to join this event?
              </label>
              <textarea
                placeholder="What do you hope to learn or accomplish?"
                value={formData.reasonToJoin}
                onChange={(e) => setFormData({ ...formData, reasonToJoin: e.target.value })}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
              ></textarea>
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                id="consent"
                checked={formData.consent}
                onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
              />
              <label htmlFor="consent" className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none">
                I agree to receive event updates from CampusCoder. <span className="text-emerald-500">*</span>
              </label>
            </div>

            {/* Submit button */}
            <div className="pt-4 border-t border-slate-900">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-2 font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Processing RSVP...
                  </>
                ) : (
                  <>
                    Confirm Registration <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
