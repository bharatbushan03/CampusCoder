'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Terminal, AlertTriangle } from 'lucide-react';
import EventForm from '../EventForm';
import { createEvent } from '@/app/actions/adminActions';

export default function CreateEventPage() {
  const router = useRouter();
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
      router.push('/admin/events');
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
        <Link href="/admin/events" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
          <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Sprints
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono flex items-center gap-2">
          <Terminal className="size-6 text-emerald-400" /> Create New Sprint
        </h1>
        <p className="text-sm text-slate-400">Configure sprint details, upload banner, and assign speakers.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-mono">
          <AlertTriangle className="size-4" /> {errorMsg}
        </div>
      )}

      {/* Form Wrapper */}
      <EventForm
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Create Coding Sprint"
      />
    </div>
  );
}
