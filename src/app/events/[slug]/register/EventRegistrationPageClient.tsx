'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  Mail,
  Users,
  LayoutDashboard,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/utils/supabase/client';
import { placeholderEvents } from '@/lib/placeholderData';
import { registerForEvent } from '@/app/actions/registrationActions';
import { registrationSchema } from '@/lib/validation';
import { toast } from 'sonner';
import type { Database } from '@/types/database.types';
import type { CodingEvent } from '@/types';
import { AnimatedSection } from '@/components/animations/ScrollAnimations';
import { RegistrationSuccessVisual } from '@/components/animations/RegistrationSuccessVisual';

type EventRow = Database['public']['Tables']['events']['Row'];
type CommunityLinkRow = Database['public']['Tables']['community_links']['Row'];
type EventData = (EventRow & Partial<CodingEvent>) | (CodingEvent & Partial<EventRow>);
type CommunityLinkItem = Pick<CommunityLinkRow, 'platform' | 'url' | 'is_active'> & { id?: string };

const codingLevels = ['Beginner', 'Intermediate', 'Advanced', 'Not started yet'];
const languages = ['C', 'C++', 'Java', 'Python', 'JavaScript', 'Not sure yet', 'Other'];

function getSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr: string) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export default function EventRegistrationPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDbOffline, setIsDbOffline] = useState(false);
  const [communityLinks, setCommunityLinks] = useState<CommunityLinkItem[]>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: 'Campus Engineering College',
    branch: '',
    year: '2nd Year (Sem 3-4)',
    codingLevel: 'Intermediate',
    preferredLanguage: 'JavaScript',
    reasonToJoin: '',
    consent: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadEvent() {
      if (!slug) return;
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single()
          .returns<EventRow>();

        if (error) throw error;

        if (data) {
          setEvent(data);
        }

        const { data: linksData } = await supabase
          .from('community_links')
          .select('*')
          .eq('is_active', true)
          .returns<CommunityLinkRow[]>();

        if (linksData) setCommunityLinks(linksData);
      } catch (err) {
        const errorCode =
          err && typeof err === 'object' && 'code' in err
            ? (err as { code?: string }).code
            : undefined;
        if (errorCode === 'PGRST116') {
          setErrorMsg('This event is not open for registration.');
          return;
        }

        console.warn('Database offline, looking up registration target in local static events');
        setIsDbOffline(true);
        const match = placeholderEvents.find((ev) => getSlug(ev.title) === slug);
        if (match) {
          setEvent(match);
        } else {
          setErrorMsg('This event does not exist.');
        }

        setCommunityLinks([
          { platform: 'Discord', url: 'https://discord.gg/VdsX64E5E', is_active: true },
          { platform: 'WhatsApp', url: 'https://chat.whatsapp.com/KLOHfAjbu91IP5C9SqPnP2', is_active: true },
        ]);
      } finally {
        setLoadingEvent(false);
      }
    }

    void loadEvent();
  }, [slug]);

  const validateField = (field: string, value: string | boolean) => {
    const result = registrationSchema.safeParse({ ...formData, [field]: value });
    if (!result.success) {
      const fieldIssue = result.error.issues.find((i) => i.path[0] === field);
      if (fieldIssue) {
      setFieldErrors((prev) => ({ ...prev, [field]: fieldIssue.message }));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setFieldErrors(({ [field]: _, ...rest }) => rest);
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setFieldErrors(({ [field]: _, ...rest }) => rest);
  }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFieldErrors({});

    if (!event) {
      setErrorMsg('This event is not available for registration.');
      return;
    }

    const now = new Date();
    const eventDate = new Date(`${event.date}T23:59:59`);
    if (event.registration_deadline && new Date(event.registration_deadline) < now) {
      setErrorMsg('The registration deadline has passed for this event.');
      return;
    }
    if (eventDate < now || event.status !== 'published') {
      setErrorMsg('Registration is closed for this event.');
      return;
    }

    const lastSub = localStorage.getItem('last_rsvp_timestamp');
    if (lastSub) {
      const diff = Date.now() - parseInt(lastSub);
      if (diff < 60000) {
        toast.error('Too many requests. Please wait a minute before another RSVP.');
        return;
      }
    }

    const validation = registrationSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      });
      setFieldErrors(errors);
      const firstError = validation.error.issues[0].message;
      setErrorMsg(firstError);
      toast.error(firstError);
      return;
    }

    setIsSubmitting(true);

    try {
      await registerForEvent(formData, event.id);

      localStorage.setItem('last_rsvp_timestamp', Date.now().toString());

      toast.success('Registration Confirmed!');
      setIsSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      console.warn('Registration failed:', err);
      toast.error(message);
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center py-40 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="size-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 font-mono">Loading registration…</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20 px-4">
        <Card glass={false} className="max-w-md w-full p-8 text-center">
          <AlertTriangle className="size-8 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-50 mb-2">Registration unavailable</h1>
          <p className="text-sm text-slate-400 mb-6">{errorMsg || 'This event is not open for public registration.'}</p>
          <Link href="/events">
            <Button variant="primary" size="sm">Back to Events</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ── SUCCESS PAGE ──
  if (isSuccess && event) {
    const eventDateStr = formatDate(event.date);
    const eventTimeStr = event.start_time
      ? `${formatTime(event.start_time || '')} – ${formatTime(event.end_time || '')}`
      : event.time;

    return (
      <div className="min-h-screen py-16 flex items-center justify-center px-4">
        <AnimatedSection className="max-w-xl w-full" direction="up">
          <Card hoverEffect className="p-8 md:p-10 text-center border-emerald-500/30">
            <RegistrationSuccessVisual />

            <h2 className="text-2xl md:text-3xl font-bold text-slate-50 mb-2">
              You&apos;re registered!
            </h2>
            <p className="text-sm text-slate-400 mb-8">
              Your spot for <span className="text-slate-200 font-medium">{event.title}</span> is confirmed.
            </p>

            {/* Event Summary */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 text-left mb-8 space-y-3">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Event details</p>
              <h3 className="text-sm font-semibold text-slate-50">{event.title}</h3>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-slate-600 shrink-0" />
                  <span>{eventDateStr}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5 text-slate-600 shrink-0" />
                  <span>{eventTimeStr}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-slate-600 shrink-0" />
                  <span className="capitalize">{event.mode || event.location || 'Online'}</span>
                </div>
              </div>
            </div>

            {/* Next steps */}
            <div className="text-left mb-8 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Next steps</p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 text-xs text-slate-400">
                  <Mail className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-200 font-medium">Check your email</p>
                    <p className="text-slate-500">We&apos;ve sent a confirmation with event details and the meeting link.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-400">
                  <MessageSquare className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-200 font-medium">Join our community</p>
                    <p className="text-slate-500">Get updates, slides, and connect with fellow participants.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-400">
                  <Users className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-200 font-medium">Attend on time</p>
                    <p className="text-slate-500">{eventDateStr} at {eventTimeStr}. See you there!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Community buttons */}
            {communityLinks.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
                {communityLinks.map((link) => {
                  const isDiscord = link.platform.toLowerCase().includes('discord');
                  const isWhatsApp = link.platform.toLowerCase().includes('whatsapp');
                  return (
                    <a
                      key={link.id || link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant={isDiscord ? 'primary' : 'secondary'}
                        size="md"
                        className="w-full sm:w-auto"
                      >
                        {isDiscord && <MessageSquare className="mr-2 size-4" />}
                        {isWhatsApp && <Phone className="mr-2 size-4" />}
                        Join {link.platform}
                      </Button>
                    </a>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-3 border-t border-slate-800 pt-6">
              <Link href="/dashboard">
                <Button variant="primary" size="md">
                  <LayoutDashboard className="mr-2 size-4" /> My Dashboard
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="outline" size="md">
                  Explore more events
                </Button>
              </Link>
            </div>
          </Card>
        </AnimatedSection>
      </div>
    );
  }

  // ── REGISTRATION FORM ──
  return (
    <div className="min-h-screen py-12 md:py-16 px-4">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Back link */}
        <Link
          href={`/events/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to event details
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ── LEFT: EVENT SUMMARY ── */}
          <AnimatedSection className="lg:col-span-2 space-y-5">
            <Card hoverEffect className="p-6">
              <Badge variant="default" className="mb-3">
                {(event.event_type || event.type || 'workshop').replace('_', ' ')}
              </Badge>
              <h2 className="text-lg font-bold text-slate-50 leading-snug mb-4">
                {event.title}
              </h2>

              <div className="space-y-3 text-xs text-slate-500">
                <div className="flex items-center gap-2.5">
                  <Calendar className="size-4 text-slate-600 shrink-0" />
                  <div>
                    <p className="text-slate-400 font-medium">{formatDate(event.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="size-4 text-slate-600 shrink-0" />
                  <div>
                    <p className="text-slate-400 font-medium">
                      {event.start_time
                        ? `${formatTime(event.start_time || '')} – ${formatTime(event.end_time || '')}`
                        : event.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="size-4 text-slate-600 shrink-0" />
                  <div>
                    <p className="text-slate-400 font-medium capitalize">
                      {event.mode || event.location || 'Online'}
                    </p>
                  </div>
                </div>
              </div>

              {event.registration_deadline && (
                <div className="mt-5 pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium mb-1">Registration deadline</p>
                  <p className="text-xs text-amber-400">{formatDate(event.registration_deadline)}</p>
                </div>
              )}

              {event.short_description && (
                <p className="text-xs text-slate-500 mt-4 leading-relaxed line-clamp-3">
                  {event.short_description}
                </p>
              )}
            </Card>

            {/* Community preview */}
            <Card hoverEffect className="p-5">
              <h4 className="text-xs font-semibold text-slate-400 mb-2">Join the community</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Get event updates, share code, and connect with others.
              </p>
            </Card>
          </AnimatedSection>

          {/* ── RIGHT: REGISTRATION FORM ── */}
          <AnimatedSection className="lg:col-span-3" delay={0.08}>
            <Card hoverEffect className="p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-50">Register for this event</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your details to confirm your spot.
                </p>
              </div>

              {isDbOffline && (
                <div className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-700 rounded-xl mb-6 text-xs text-slate-400">
                  <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                  <span>Offline mode: registration will not be saved to the database.</span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg mb-6">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-medium text-slate-400 mb-1.5">
                      Full Name <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      onBlur={(e) => validateField('fullName', e.target.value)}
                      className={`w-full bg-slate-900 border ${
                        fieldErrors.fullName ? 'border-red-500/50' : 'border-slate-800'
                      } rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors`}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1.5">
                      Email Address <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="e.g. rahul@college.edu"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      onBlur={(e) => validateField('email', e.target.value)}
                      className={`w-full bg-slate-900 border ${
                        fieldErrors.email ? 'border-red-500/50' : 'border-slate-800'
                      } rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors`}
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Phone + Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-xs font-medium text-slate-400 mb-1.5">
                      Phone Number <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      onBlur={(e) => validateField('phone', e.target.value)}
                      className={`w-full bg-slate-900 border ${
                        fieldErrors.phone ? 'border-red-500/50' : 'border-slate-800'
                      } rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors`}
                    />
                    {fieldErrors.phone && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="year" className="block text-xs font-medium text-slate-400 mb-1.5">
                      Year / Semester <span className="text-emerald-500">*</span>
                    </label>
                    <select
                      id="year"
                      value={formData.year}
                      onChange={(e) => updateField('year', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      <option value="1st Year (Sem 1-2)">1st Year (Sem 1-2)</option>
                      <option value="2nd Year (Sem 3-4)">2nd Year (Sem 3-4)</option>
                      <option value="3rd Year (Sem 5-6)">3rd Year (Sem 5-6)</option>
                      <option value="4th Year (Sem 7-8)">4th Year (Sem 7-8)</option>
                    </select>
                    <p className="text-[10px] text-slate-600 mt-1">Select your current year of study</p>
                  </div>
                </div>

                {/* College + Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="college" className="block text-xs font-medium text-slate-400 mb-1.5">
                      College Name <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      id="college"
                      type="text"
                      required
                      value={formData.college}
                      onChange={(e) => updateField('college', e.target.value)}
                      onBlur={(e) => validateField('college', e.target.value)}
                      className={`w-full bg-slate-900 border ${
                        fieldErrors.college ? 'border-red-500/50' : 'border-slate-800'
                      } rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors`}
                    />
                    {fieldErrors.college && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.college}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="branch" className="block text-xs font-medium text-slate-400 mb-1.5">
                      Branch / Department <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      id="branch"
                      type="text"
                      required
                      placeholder="e.g. Computer Science"
                      value={formData.branch}
                      onChange={(e) => updateField('branch', e.target.value)}
                      onBlur={(e) => validateField('branch', e.target.value)}
                      className={`w-full bg-slate-900 border ${
                        fieldErrors.branch ? 'border-red-500/50' : 'border-slate-800'
                      } rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors`}
                    />
                    {fieldErrors.branch && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.branch}</p>
                    )}
                    <p className="text-[10px] text-slate-600 mt-1">e.g. CSE, IT, ECE, Mechanical</p>
                  </div>
                </div>

                {/* Coding Level + Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="codingLevel" className="block text-xs font-medium text-slate-400 mb-1.5">
                      Current Coding Level
                    </label>
                    <select
                      id="codingLevel"
                      value={formData.codingLevel}
                      onChange={(e) => updateField('codingLevel', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      {codingLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-600 mt-1">Helps us match the session to your level</p>
                  </div>
                  <div>
                    <label htmlFor="preferredLanguage" className="block text-xs font-medium text-slate-400 mb-1.5">
                      Preferred Language
                    </label>
                    <select
                      id="preferredLanguage"
                      value={formData.preferredLanguage}
                      onChange={(e) => updateField('preferredLanguage', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reason to join */}
                <div>
                  <label htmlFor="reasonToJoin" className="block text-xs font-medium text-slate-400 mb-1.5">
                    What do you hope to learn?
                  </label>
                  <textarea
                    id="reasonToJoin"
                    placeholder="What do you hope to learn or accomplish? (optional)"
                    value={formData.reasonToJoin}
                    onChange={(e) => updateField('reasonToJoin', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                {/* Consent */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    required
                    id="consent"
                    checked={formData.consent}
                    onChange={(e) => updateField('consent', e.target.checked)}
                    className="mt-0.5 size-4 rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="consent" className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none">
                    I agree to receive event updates from CampusCoder. <span className="text-emerald-500">*</span>
                  </label>
                </div>

                {/* Submit */}
                <div className="pt-4 border-t border-slate-800">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full h-12"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" /> Processing…
                      </>
                    ) : (
                      <>
                        Reserve my spot <ArrowRight className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </AnimatedSection>

        </div>
      </div>
    </div>
  );
}
