'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Terminal, AlertTriangle, Building2 } from 'lucide-react';
import EventForm from '../EventForm';
import { createEvent } from '@/app/actions/adminActions';

function CreateEventPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campusParam = searchParams.get('campus') || '';
  const clubParam = searchParams.get('club') || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFormSubmit = async (eventData: any, speakers: any[]) => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await createEvent(eventData, speakers);
      if (!res.success) {
        setErrorMsg(res.error || 'An error occurred while creating the event.');
        return;
      }
      if (campusParam) {
        router.push(`/admin/campuses?campus=${encodeURIComponent(campusParam)}${clubParam ? `&club=${encodeURIComponent(clubParam)}` : ''}&tab=events`);
      } else {
        router.push('/admin/events');
      }
      router.refresh();
    } catch (err: any) {
      console.error('Event creation error:', err);
      setErrorMsg(err.message || 'An error occurred while creating the event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <Link 
          href={campusParam ? `/admin/campuses?campus=${encodeURIComponent(campusParam)}${clubParam ? `&club=${encodeURIComponent(clubParam)}` : ''}` : '/admin/events'} 
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group"
        >
          <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> 
          {campusParam ? `Back to ${campusParam} Console` : 'Back to Sprints'}
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono flex items-center gap-2">
          <Terminal className="size-6 text-emerald-400" /> Create New Workshop / Sprint
        </h1>
        <p className="text-sm text-slate-400">
          Workshops must be configured for a specific campus and student cohort.
        </p>

        {campusParam && (
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300">
            <Building2 className="size-3.5" />
            Target Campus Pre-Selected: <span className="font-bold">{campusParam}</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-mono">
          <AlertTriangle className="size-4" /> {errorMsg}
        </div>
      )}

      {/* Form Wrapper */}
      <EventForm
        initialData={{
          college: campusParam,
          club_id: clubParam || undefined,
        }}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Create Coding Sprint"
      />
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-mono text-xs">Loading sprint editor...</div>}>
      <CreateEventPageContent />
    </Suspense>
  );
}
