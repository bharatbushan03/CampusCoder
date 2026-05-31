'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell } from 'lucide-react';
import Link from 'next/link';
import AnnouncementForm from '../AnnouncementForm';
import { createAnnouncement } from '@/app/actions/adminActions';

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await createAnnouncement(data);
      router.push('/admin/announcements');
      router.refresh();
    } catch (err: any) {
      alert('Failed to create announcement: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-1">
        <Link href="/admin/announcements" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
          <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Announcements
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
          <Bell className="size-8 text-emerald-500" /> New Announcement
        </h1>
        <p className="text-sm text-slate-400">Broadcast a new update to the community.</p>
      </div>

      <AnnouncementForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Post Announcement"
      />
    </div>
  );
}
