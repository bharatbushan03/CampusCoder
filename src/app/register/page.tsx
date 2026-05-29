'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Terminal, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { placeholderEvents } from '@/lib/placeholderData';
import Link from 'next/link';

// Create a component that reads search params
function RegisterForm() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams ? searchParams.get('eventId') : null;

  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    graduationYear: '2027',
    collegeRoll: '',
    eventId: initialEventId || '',
    interests: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const interestOptions = [
    'Data Structures & Algorithms',
    'Web Development (React/Next.js)',
    'Competitive Programming',
    'Mobile App Development',
    'Machine Learning & AI',
    'UI/UX Design',
  ];

  const handleInterestChange = (interest: string) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter((i) => i !== interest),
      });
    } else {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest],
      });
    }
  };

  const selectedEvent = placeholderEvents.find((e) => e.id === formData.eventId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.studentEmail || !formData.collegeRoll) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);

    // Simulate database write
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <Card hoverEffect={false} className="max-w-xl mx-auto p-10 border-emerald-500/30 bg-slate-900 text-center glow-box">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Registration Successful!</h2>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Awesome, {formData.studentName}! We have saved your RSVP. A calendar invite and session link will be sent to{' '}
          <span className="text-emerald-400 font-mono">{formData.studentEmail}</span> shortly.
        </p>

        {selectedEvent && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 text-left mb-8 max-w-md mx-auto">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">RSVP Event</p>
            <p className="text-sm font-bold text-white mt-1">{selectedEvent.title}</p>
            <p className="text-xs text-emerald-400 font-mono mt-1">{selectedEvent.date} @ {selectedEvent.time}</p>
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
          <Terminal className="h-5 w-5 text-emerald-400" /> Join the Community
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Complete the form below to register for a specific sprint, or simply sign up as an active member.
        </p>
      </div>

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
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
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
              value={formData.studentEmail}
              onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* College Roll/ID */}
          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
              University Roll / Registration ID <span className="text-emerald-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CSE-2023-08"
              value={formData.collegeRoll}
              onChange={(e) => setFormData({ ...formData, collegeRoll: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Graduation Year */}
          <div>
            <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
              Graduation Year
            </label>
            <select
              value={formData.graduationYear}
              onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            >
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
            </select>
          </div>
        </div>

        {/* Select Event */}
        <div>
          <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
            Select Upcoming Event (Optional)
          </label>
          <select
            value={formData.eventId}
            onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="">General Community Membership Only</option>
            {placeholderEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({new Date(ev.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})
              </option>
            ))}
          </select>
        </div>

        {/* Coding Interests */}
        <div>
          <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-4">
            Coding & Tech Interests
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {interestOptions.map((interest) => (
              <label
                key={interest}
                className={`flex items-center gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                  formData.interests.includes(interest)
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-850 hover:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.interests.includes(interest)}
                  onChange={() => handleInterestChange(interest)}
                  className="rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-800 h-4 w-4 accent-emerald-500"
                />
                <span>{interest}</span>
              </label>
            ))}
          </div>
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
                Confirm Community Registration <ArrowRight className="h-4 w-4" />
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
