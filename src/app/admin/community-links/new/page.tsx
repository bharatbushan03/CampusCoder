'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import CommunityLinkForm from '../CommunityLinkForm';
import { createCommunityLink } from '@/app/actions/adminActions';

export default function NewCommunityLinkPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await createCommunityLink(data);
      router.push('/admin/community-links');
      router.refresh();
    } catch (err: any) {
      alert('Failed to create community link: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-1">
        <Link href="/admin/community-links" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Links
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
          <PlusCircle className="h-8 w-8 text-emerald-500" /> Add Community Link
        </h1>
        <p className="text-sm text-slate-400">Create a new social endpoint for the community.</p>
      </div>

      <CommunityLinkForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Create Link"
      />
    </div>
  );
}
