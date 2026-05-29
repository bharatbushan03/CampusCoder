'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Bell, Calendar, Loader2, Save, AlignLeft, Type, Info
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { announcementSchema } from '@/lib/validation';
import { toast } from 'sonner';

interface AnnouncementFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText: string;
}

export default function AnnouncementForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText
}: AnnouncementFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [message, setMessage] = useState(initialData?.message || '');
  const [eventId, setEventId] = useState(initialData?.event_id || '');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [publishDate, setPublishDate] = useState(
    initialData?.publish_date 
      ? new Date(initialData.publish_date).toISOString().slice(0, 16) 
      : new Date().toISOString().slice(0, 16)
  );

  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from('events')
          .select('id, title')
          .order('date', { ascending: false });

        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.error('Error loading events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    loadEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      title: title.trim(),
      message: message.trim(),
      event_id: eventId || null,
      is_active: isActive,
      publish_date: new Date(publishDate).toISOString()
    };

    const validation = announcementSchema.safeParse(payload);
    if (!validation.success) {
      const error = validation.error.issues[0].message;
      toast.error(error);
      return;
    }

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-slate-900 bg-slate-950/40 p-6 sm:p-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Type className="h-3 w-3 text-emerald-400" /> Announcement Title
            </label>
            <input
              type="text"
              placeholder="e.g. New Workshop Series Starting Soon!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <AlignLeft className="h-3 w-3 text-emerald-400" /> Message
            </label>
            <textarea
              placeholder="Detailed announcement text..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-3 w-3 text-emerald-400" /> Publish Date
              </label>
              <input
                type="datetime-local"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Info className="h-3 w-3 text-emerald-400" /> Related Event (Optional)
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                disabled={loadingEvents}
              >
                <option value="">No related event</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
              {loadingEvents && <p className="text-[10px] text-slate-500 font-mono">Loading events...</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
            />
            <label htmlFor="is_active" className="text-sm text-slate-300 cursor-pointer select-none">
              Visible to public (Active)
            </label>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          variant="primary" 
          disabled={isSubmitting}
          className="flex items-center gap-2 min-w-[150px] justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> {submitButtonText}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
