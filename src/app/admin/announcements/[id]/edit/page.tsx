'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import AnnouncementForm from '../../AnnouncementForm';

export default function EditAnnouncementPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setInitialData(data);
      } catch (err: any) {
        alert('Error loading announcement: ' + err.message);
        router.push('/admin/announcements');
      } finally {
        setLoading(false);
      }
    };

    if (id) loadAnnouncement();
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from('announcements')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      router.push('/admin/announcements');
      router.refresh();
    } catch (err: any) {
      alert('Failed to update announcement: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[calc(100vh-10rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-400">Loading announcement details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-1">
        <Link href="/admin/announcements" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Announcements
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
          <Edit className="h-8 w-8 text-emerald-500" /> Edit Announcement
        </h1>
        <p className="text-sm text-slate-400">Update the details for this broadcast.</p>
      </div>

      <AnnouncementForm 
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Save Changes"
      />
    </div>
  );
}
