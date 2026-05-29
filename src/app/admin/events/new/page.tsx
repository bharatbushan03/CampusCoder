'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Terminal, AlertTriangle } from 'lucide-react';
import EventForm from '../EventForm';
import { createClient } from '@/utils/supabase/client';

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFormSubmit = async (eventData: any, speakers: any[]) => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const supabase = createClient() as any;

      // Get authenticated user ID to track who created it
      const { data: { user } } = await supabase.auth.getUser();
      const createdBy = user ? user.id : null;

      // 1. Insert event
      const { data: insertedEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          ...eventData,
          created_by: createdBy
        })
        .select()
        .single();

      if (eventError) {
        throw eventError;
      }

      if (!insertedEvent) {
        throw new Error('Event insertion failed. No data returned.');
      }

      // 2. Insert speakers if any
      if (speakers && speakers.length > 0) {
        const speakersToInsert = speakers.map((speaker) => ({
          event_id: insertedEvent.id,
          name: speaker.name,
          role: speaker.role || null,
          email: speaker.email || null,
          bio: speaker.bio || null,
          profile_image_url: speaker.profile_image_url || null
        }));

        const { error: speakersError } = await supabase
          .from('event_owners')
          .insert(speakersToInsert);

        if (speakersError) {
          console.error('Failed to insert event owners:', speakersError);
          // We can proceed even if speaker insertion failed, but log it
        }
      }

      // Redirect on success
      router.push('/admin/events');
      router.refresh();
    } catch (err: any) {
      console.error('Event creation error:', err);
      setErrorMsg(err.message || 'An error occurred while creating the event.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <Link href="/admin/events" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Sprints
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono flex items-center gap-2">
          <Terminal className="h-6 w-6 text-emerald-400" /> Create New Sprint
        </h1>
        <p className="text-sm text-slate-400">Configure sprint details, upload banner, and assign speakers.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-mono">
          <AlertTriangle className="h-4 w-4" /> {errorMsg}
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
