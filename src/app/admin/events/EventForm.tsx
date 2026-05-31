'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Terminal, Lock, Unlock, Upload, X, Plus, Trash2, Mail, User, Users,
  Briefcase, AlignLeft, Globe, Loader2, AlertTriangle, Calendar, Clock
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { eventSchema } from '@/lib/validation';
import { toast } from 'sonner';

interface Speaker {
  id?: string;
  name: string;
  role: string;
  email: string;
  bio: string;
  profile_image_url: string;
}

interface EventFormProps {
  initialData?: any;
  initialSpeakers?: Speaker[];
  onSubmit: (eventData: any, speakers: Speaker[]) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText: string;
}

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function EventForm({
  initialData,
  initialSpeakers = [],
  onSubmit,
  isSubmitting,
  submitButtonText
}: EventFormProps) {
  
  // General event form fields
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [slugLocked, setSlugLocked] = useState(!initialData?.slug);
  const [shortDescription, setShortDescription] = useState(initialData?.short_description || '');
  const [fullDescription, setFullDescription] = useState(initialData?.full_description || '');
  const [eventType, setEventType] = useState(initialData?.event_type || 'workshop');
  const [mode, setMode] = useState(initialData?.mode || 'online');
  const [date, setDate] = useState(initialData?.date || '');
  const [startTime, setStartTime] = useState(initialData?.start_time || '');
  const [endTime, setEndTime] = useState(initialData?.end_time || '');
  const [meetingLink, setMeetingLink] = useState(initialData?.meeting_link || '');
  const [registrationDeadline, setRegistrationDeadline] = useState(
    initialData?.registration_deadline 
      ? new Date(initialData.registration_deadline).toISOString().slice(0, 16) 
      : ''
  );
  const [bannerUrl, setBannerUrl] = useState(initialData?.banner_url || '');
  const [status, setStatus] = useState(initialData?.status || 'draft');

  // Speakers list state
  const [speakers, setSpeakers] = useState<Speaker[]>(initialSpeakers);

  // New speaker input subform state
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [newSpeakerRole, setNewSpeakerRole] = useState('');
  const [newSpeakerEmail, setNewSpeakerEmail] = useState('');
  const [newSpeakerBio, setNewSpeakerBio] = useState('');
  const [newSpeakerImageUrl, setNewSpeakerImageUrl] = useState('');

  // Banner image upload state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState(initialData?.banner_url || '');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (slugLocked) {
      setSlug(generateSlug(value));
    }
  };

  const toggleSlugLock = () => {
    const nextSlugLocked = !slugLocked;
    setSlugLocked(nextSlugLocked);
    if (nextSlugLocked) {
      setSlug(generateSlug(title));
    }
  };

  // Handle Banner file change and validation
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please select a valid PNG, JPG, WEBP, or GIF image.');
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size exceeds 2MB limit.');
      return;
    }

    setUploadError('');
    setBannerFile(file);
    
    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setBannerPreview(previewUrl);
  };

  // Upload image to Supabase Storage
  const uploadBanner = async (file: File): Promise<string | null> => {
    try {
      const supabase = createClient() as any;
      const fileExt = file.name.split('.').pop();
      const fileName = `banners/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload file to 'banners' bucket
      const { data, error } = await supabase.storage
        .from('banners')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // If bucket doesn't exist, log and notify
        console.warn('Storage bucket upload failed, check if public "banners" bucket is configured:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err: any) {
      console.warn('Error uploading banner to Supabase:', err);
      // Fail gracefully - fall back to text url or local object url
      setUploadError('Could not upload to Supabase storage. Check the banners bucket and try again.');
      return null;
    }
  };

  // Add Speaker to local state list
  const handleAddSpeaker = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newSpeakerName) {
      alert('Speaker name is required.');
      return;
    }

    const speaker: Speaker = {
      name: newSpeakerName,
      role: newSpeakerRole,
      email: newSpeakerEmail,
      bio: newSpeakerBio,
      profile_image_url: newSpeakerImageUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newSpeakerName)}`
    };

    setSpeakers([...speakers, speaker]);

    // Reset speaker fields
    setNewSpeakerName('');
    setNewSpeakerRole('');
    setNewSpeakerEmail('');
    setNewSpeakerBio('');
    setNewSpeakerImageUrl('');
  };

  const handleRemoveSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_, i) => i !== index));
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const eventData = {
      title: title.trim(),
      slug: slug.trim(),
      short_description: shortDescription?.trim() || null,
      full_description: fullDescription?.trim() || null,
      event_type: eventType,
      mode,
      date,
      start_time: startTime,
      end_time: endTime,
      meeting_link: meetingLink?.trim() || null,
      registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
      status
    };

    const validation = eventSchema.safeParse(eventData);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message;
      toast.error(firstError);
      return;
    }

    setUploadProgress(true);
    let finalBannerUrl = bannerUrl;

    if (bannerFile) {
      const uploadedUrl = await uploadBanner(bannerFile);
      if (uploadedUrl) {
        finalBannerUrl = uploadedUrl;
      } else if (bannerUrl.startsWith('http')) {
        finalBannerUrl = bannerUrl;
      } else {
        finalBannerUrl = '';
      }
    }

    try {
      await onSubmit({ ...eventData, banner_url: finalBannerUrl }, speakers);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save event');
    } finally {
      setUploadProgress(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* 1. Core Event Details Card */}
      <Card hoverEffect={false} className="border-slate-900 bg-slate-950/20 p-6 md:p-8 space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-slate-900 pb-3 flex items-center gap-2 font-mono">
          <Terminal className="size-4 text-emerald-400" /> Event Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label htmlFor="eventform-event-title" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Event Title *
            </label>
            <input id="eventform-event-title"
              type="text"
              required
              placeholder="e.g. Next.js Web Dev Camp"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="eventform-url-slug" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              URL Slug *
            </label>
            <div className="relative">
              <input id="eventform-url-slug"
                type="text"
                required
                disabled={slugLocked}
                placeholder="nextjs-web-dev-camp"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 disabled:bg-slate-950/40 disabled:text-slate-500 rounded-lg pl-4 pr-10 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={toggleSlugLock}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                title={slugLocked ? 'Unlock Slug' : 'Lock Slug'}
              >
                {slugLocked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Event Type */}
          <div>
            <label htmlFor="eventform-event-type" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Event Type
            </label>
            <select id="eventform-event-type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
            >
              <option value="workshop">Workshop</option>
              <option value="coding_session">Coding Session</option>
              <option value="orientation">Orientation</option>
              <option value="challenge">Challenge</option>
              <option value="webinar">Webinar</option>
            </select>
          </div>

          {/* Mode */}
          <div>
            <label htmlFor="eventform-mode" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Mode
            </label>
            <select id="eventform-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="eventform-status" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Status
            </label>
            <select id="eventform-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
            >
              <option value="draft">Draft (Private)</option>
              <option value="published">Published (Public)</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date */}
          <div>
            <label htmlFor="eventform-date" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Calendar className="size-3.5" /> Date *
            </label>
            <input id="eventform-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Start Time */}
          <div>
            <label htmlFor="eventform-start-time" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Clock className="size-3.5" /> Start Time *
            </label>
            <input id="eventform-start-time"
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* End Time */}
          <div>
            <label htmlFor="eventform-end-time" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Clock className="size-3.5" /> End Time *
            </label>
            <input id="eventform-end-time"
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Meeting Link */}
          <div>
            <label htmlFor="eventform-stream-meeting-link-google-meet-zoom" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Stream / Meeting Link (Google Meet, Zoom)
            </label>
            <input id="eventform-stream-meeting-link-google-meet-zoom"
              type="url"
              placeholder="https://meet.google.com/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
            />
          </div>

          {/* Registration Deadline */}
          <div>
            <label htmlFor="eventform-registration-deadline" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Registration Deadline
            </label>
            <input id="eventform-registration-deadline"
              type="datetime-local"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Short Description */}
        <div>
          <label htmlFor="eventform-short-description-card-preview" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
            <AlignLeft className="size-3.5" /> Short Description (Card Preview)
          </label>
          <input id="eventform-short-description-card-preview"
            type="text"
            placeholder="Brief learning outcome summary&hellip;"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Full Description */}
        <div>
          <label htmlFor="eventform-detailed-description-supports-markdown" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
            Detailed Description (Supports Markdown)
          </label>
          <textarea id="eventform-detailed-description-supports-markdown"
            rows={6}
            placeholder="Provide a detailed breakdown of the curriculum, schedule, materials&hellip;"
            value={fullDescription}
            onChange={(e) => setFullDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          ></textarea>
        </div>
      </Card>

      {/* 2. Banner Upload Card */}
      <Card hoverEffect={false} className="border-slate-900 bg-slate-950/20 p-6 md:p-8 space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-slate-900 pb-3 flex items-center gap-2 font-mono">
          <Upload className="size-4 text-emerald-400" /> Event Banner
        </h3>

        {uploadError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-mono">
            <AlertTriangle className="size-4" /> {uploadError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-emerald-500/40 rounded-xl p-8 text-center bg-slate-950/50 cursor-pointer transition-colors group"
          >
            <input aria-label="Upload banner image"
              type="file"
              ref={fileInputRef}
              onChange={handleBannerFileChange}
              accept="image/*"
              className="hidden"
            />
            <div className="flex size-12 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 mx-auto mb-4 group-hover:border-emerald-500/25 transition-colors">
              <Upload className="size-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-white">Click or drag banner image here</p>
            <p className="text-xs text-slate-500 mt-1 font-mono">PNG, JPG, WEBP up to 2MB</p>
          </div>

          {/* Preview Area */}
          <div>
            {bannerPreview ? (
              <div className="relative border border-slate-800 bg-slate-950/50 rounded-xl p-2 max-w-sm mx-auto group">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                  <Image
                    src={bannerPreview}
                    alt="Banner preview"
                    fill
                    unoptimized
                    sizes="384px"
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBannerFile(null);
                    setBannerPreview('');
                    setBannerUrl('');
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 transition-all shadow-lg opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Remove image"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="border border-slate-900/60 bg-slate-950/30 rounded-xl aspect-video max-w-sm mx-auto flex items-center justify-center text-slate-600 text-xs font-mono">
                No banner image selected.
              </div>
            )}
          </div>
        </div>

        {/* Fallback URL input */}
        <div className="pt-4 border-t border-slate-900/40">
          <label htmlFor="eventform-or-paste-a-direct-image-url-fallback" className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">
            Or paste a direct image URL (fallback)
          </label>
          <input id="eventform-or-paste-a-direct-image-url-fallback"
            type="url"
            placeholder="https://images.unsplash.com/photo-..."
            value={bannerUrl}
            onChange={(e) => {
              setBannerUrl(e.target.value);
              setBannerPreview(e.target.value);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 font-mono transition-colors"
          />
        </div>
      </Card>

      {/* 3. Event Owners / Speakers Section */}
      <Card hoverEffect={false} className="border-slate-900 bg-slate-950/20 p-6 md:p-8 space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-slate-900 pb-3 flex items-center gap-2 font-mono">
          <Users className="size-4 text-emerald-400" /> Speakers & Event Owners
        </h3>

        {/* Added speakers list */}
        {speakers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-900/60">
            {speakers.map((speaker, idx) => (
              <div key={speaker.id || `${speaker.email || speaker.name}-${speaker.role}`} className="flex gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/40 relative group">
                <Image
                  src={speaker.profile_image_url}
                  alt={speaker.name}
                  width={48}
                  height={48}
                  unoptimized
                  className="size-12 rounded-full object-cover border border-slate-800"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{speaker.name}</p>
                  <p className="text-xs text-emerald-400 font-mono">{speaker.role}</p>
                  {speaker.email && <p className="text-[10px] text-slate-500 font-mono truncate">{speaker.email}</p>}
                  {speaker.bio && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{speaker.bio}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSpeaker(idx)}
                  className="absolute top-2 right-2 text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                  title="Remove Speaker"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-mono pb-4 border-b border-slate-900/40">No speakers added yet. Sprints should ideally feature at least one speaker/organizer.</p>
        )}

        {/* Add speaker subform */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-4">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Plus className="size-4 text-emerald-500" /> Add New Speaker
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Speaker Name */}
            <div>
              <label htmlFor="eventform-name" className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-600" />
                <input id="eventform-name"
                  type="text"
                  placeholder="Speaker Name"
                  value={newSpeakerName}
                  onChange={(e) => setNewSpeakerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Speaker Role */}
            <div>
              <label htmlFor="eventform-role-affiliation" className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Role / Affiliation</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-600" />
                <input id="eventform-role-affiliation"
                  type="text"
                  placeholder="e.g. SDE-2 @ Google"
                  value={newSpeakerRole}
                  onChange={(e) => setNewSpeakerRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Speaker Email */}
            <div>
              <label htmlFor="eventform-email" className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-600" />
                <input id="eventform-email"
                  type="email"
                  placeholder="speaker@college.edu"
                  value={newSpeakerEmail}
                  onChange={(e) => setNewSpeakerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                />
              </div>
            </div>

            {/* Speaker Image URL */}
            <div>
              <label htmlFor="eventform-profile-image-url-optional" className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Profile Image URL (Optional)</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-600" />
                <input id="eventform-profile-image-url-optional"
                  type="url"
                  placeholder="https://..."
                  value={newSpeakerImageUrl}
                  onChange={(e) => setNewSpeakerImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Speaker Bio */}
          <div>
            <label htmlFor="eventform-short-bio" className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Short Bio</label>
            <textarea id="eventform-short-bio"
              rows={2}
              placeholder="Short introductory bio&hellip;"
              value={newSpeakerBio}
              onChange={(e) => setNewSpeakerBio(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            ></textarea>
          </div>

          <Button 
            type="button" 
            variant="secondary" 
            size="sm"
            onClick={handleAddSpeaker}
            className="flex items-center gap-1"
          >
            <Plus className="size-3.5" /> Append Speaker
          </Button>
        </div>
      </Card>

      {/* Form Submission Footer Actions */}
      <div className="flex items-center justify-end gap-4 border-t border-slate-900 pt-6">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => window.history.back()}
          className="border-slate-800 text-slate-300 hover:text-white"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={isSubmitting || uploadProgress}
          className="flex items-center gap-2"
        >
          {isSubmitting || uploadProgress ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving&hellip;
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      </div>

    </form>
  );
}
