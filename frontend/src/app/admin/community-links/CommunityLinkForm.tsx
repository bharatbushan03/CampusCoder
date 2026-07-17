'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Link2, Globe, Loader2, Save
} from 'lucide-react';

import { communityLinkSchema } from '@/lib/validation';
import { toast } from 'sonner';

interface CommunityLinkFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText: string;
}

export default function CommunityLinkForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText
}: CommunityLinkFormProps) {
  const [platform, setPlatform] = useState(initialData?.platform || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      platform: platform.trim(),
      url: url.trim(),
      is_active: isActive
    };

    const validation = communityLinkSchema.safeParse(payload);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="communitylinkform-platform-name" className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Globe className="size-3 text-emerald-400" /> Platform Name
              </label>
              <input id="communitylinkform-platform-name"
                type="text"
                placeholder="e.g. Discord, WhatsApp, GitHub"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="communitylinkform-url" className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Link2 className="size-3 text-emerald-400" /> URL
              </label>
              <input id="communitylinkform-url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
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
              <Loader2 className="size-4 animate-spin" /> Processing&hellip;
            </>
          ) : (
            <>
              <Save className="size-4" /> {submitButtonText}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
