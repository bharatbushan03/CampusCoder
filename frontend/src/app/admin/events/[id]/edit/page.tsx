'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Terminal, AlertTriangle, Loader2 } from 'lucide-react';
import EventForm from '../../EventForm';
import { updateEvent } from '@/app/actions/adminActions';
import { api } from '@/lib/api';

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

  // Fetch current event and speakers from the backend
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const data = await api<{ ok: boolean; event: any; owners: any[] }>(`/admin/events/${id}`);
        setEventData(data.event);
        setSpeakers(data.owners || []);
      } catch (err: any) {
        console.error('Failed to load event for edit:', err);
        setErrorMsg('Could not fetch event data. Please verify backend connectivity.');
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
      const res = await updateEvent(id, updatedEventData, updatedSpeakers);
      if (!res.success) {
        setErrorMsg(res.error || 'An error occurred while updating the event.');
        return;
      }
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

      {/* Permission Block for Other Club Organizers */}
      {eventData && eventData.can_edit === false ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center space-y-4">
          <div className="size-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white font-mono">Modify Permission Restricted</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              This sprint event is hosted by <strong>{eventData.club?.name || 'another club'}</strong>. Only {eventData.club?.name || 'hosting club'} organizers or global administrators have permission to edit or delete it.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link href={`/admin/events/${id}`}>
              <button type="button" className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-colors cursor-pointer">
                View Event Overview
              </button>
            </Link>
            <Link href="/admin/events">
              <button type="button" className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-mono transition-colors cursor-pointer">
                Back to All Events
              </button>
            </Link>
          </div>
        </div>
      ) : (
        eventData && (
          <EventForm
            initialData={eventData}
            initialSpeakers={speakers}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Save Changes"
          />
        )
      )}
    </div>
  );
}
