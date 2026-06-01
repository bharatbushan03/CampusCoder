'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Terminal, AlertTriangle, Loader2 } from 'lucide-react';
import EventForm from '../../EventForm';
import { updateEvent } from '@/app/actions/adminActions';
import { createClient } from '@/utils/supabase/client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditEventPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch current event and speakers (Read-only, so client side is okay)
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const supabase = createClient() as any;

        // Fetch event details
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (eventError) throw eventError;
        setEventData(event);

        // Fetch event owners/speakers
        const { data: owners, error: ownersError } = await supabase
          .from('event_owners')
          .select('*')
          .eq('event_id', id);

        if (ownersError) throw ownersError;
        setSpeakers(owners || []);

      } catch (err: any) {
        console.error('Failed to load event for edit:', err);
        setErrorMsg('Could not fetch event data. Please verify database connectivity.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  const handleFormSubmit = async (updatedEventData: any, updatedSpeakers: any[]) => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await updateEvent(id, updatedEventData, updatedSpeakers);
      router.push('/admin/events');
      router.refresh();
    } catch (err: any) {
      console.error('Event edit submit failed:', err);
      setErrorMsg(err.message || 'An error occurred while updating the event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[calc(100vh-10rem)]">
        <div className="text-center">
          <Loader2 className="size-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-400">Loading sprint configuration&hellip;</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <Link href="/admin/events" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
          <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Sprints
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono flex items-center gap-2">
          <Terminal className="size-6 text-emerald-400" /> Edit Sprint Event
        </h1>
        <p className="text-sm text-slate-400">Modify sprint configuration, re-upload banner, or update speakers panel.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-mono">
          <AlertTriangle className="size-4" /> {errorMsg}
        </div>
      )}

      {/* Form Wrapper */}
      {eventData && (
        <EventForm
          initialData={eventData}
          initialSpeakers={speakers}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Save Changes"
        />
      )}
    </div>
  );
}
