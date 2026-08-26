'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Terminal, Calendar, Clock, MapPin, Users, 
  ExternalLink, Mail, Save, AlertTriangle, CheckCircle2, 
  Loader2, Eye, Info, Send, Layers
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { sendMeetingLinkToAll } from '@/app/actions/emailActions';
import { MeetingLinkEmail } from '@/components/emails/MeetingLinkAnnouncement';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventManagementPage({ params }: PageProps) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [meetingLink, setMeetingLink] = useState('');
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const [eventRes, regsRes] = await Promise.all([
        api<{ ok: boolean; event: any }>(`/admin/events/${id}`),
        api<{ ok: boolean; registrations: any[] }>(`/admin/events/${id}/registrations`),
      ]);

      setEvent(eventRes.event);
      setMeetingLink(eventRes.event.meeting_link || '');
      setRegistrations(regsRes.registrations || []);

    } catch (err: any) {
      console.error('Failed to load event data:', err);
      setErrorMsg('Error loading management console. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSaveLink = async () => {
    setIsSavingLink(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api(`/admin/events/${id}/meeting-link`, {
        method: 'PATCH',
        body: JSON.stringify({ meeting_link: meetingLink }),
      });
      setSuccessMsg('Meeting link saved successfully.');
      await loadData();
    } catch (err: any) {
      setErrorMsg('Failed to save link: ' + err.message);
    } finally {
      setIsSavingLink(false);
    }
  };

  const handleSendEmails = async (force: boolean = false) => {
    setIsSendingEmails(true);
    setErrorMsg('');
    setSuccessMsg('');
    setShowConfirmModal(false);
    
    try {
      const res = await sendMeetingLinkToAll(id, force);
      setSuccessMsg(`Successfully sent meeting link to ${res.sent} students.`);
      await loadData();
    } catch (err: any) {
      setErrorMsg('Error during email blast: ' + err.message);
    } finally {
      setIsSendingEmails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[calc(100vh-10rem)]">
        <div className="text-center">
          <Loader2 className="size-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-slate-400">Loading management console&hellip;</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin/events" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
            <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Sprints
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">{event.title}</h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
              event.status === 'published' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              {event.status.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-slate-400 flex items-center gap-4">
            <span className="flex items-center gap-1"><Calendar className="size-3.5" /> {new Date(event.date).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Clock className="size-3.5" /> {event.start_time} - {event.end_time}</span>
            <span className="flex items-center gap-1 capitalize"><MapPin className="size-3.5" /> {event.mode}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/admin/events/${id}/edit`}>
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              Edit Config
            </Button>
          </Link>
          <a href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <ExternalLink className="size-4" /> View Public
            </Button>
          </a>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-mono">
          <CheckCircle2 className="size-4" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-mono">
          <AlertTriangle className="size-4" /> {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Meeting Link Management */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-800 bg-slate-950/40 p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Mail className="size-5 text-emerald-400" /> Meeting Link Delivery
              </h2>
              {event.meeting_link_sent_at && (
                <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
                  Last Sent: {new Date(event.meeting_link_sent_at).toLocaleString()}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="page-session-url-google-meet-zoom-etc" className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Session URL (Google Meet / Zoom / etc.)
                </label>
                <div className="flex gap-2">
                  <input id="page-session-url-google-meet-zoom-etc"
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                  />
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleSaveLink}
                    disabled={isSavingLink || meetingLink === (event.meeting_link || '')}
                    className="flex items-center gap-1.5"
                  >
                    {isSavingLink ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Save
                  </Button>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mt-1">
                    <Info className="size-4 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">Broadcast Announcement</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      This will send an official meeting link email to all <strong>{registrations.length} registered students</strong>. 
                      You can preview the email content before sending.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-1.5 border-slate-700 text-slate-300 hover:text-white"
                  >
                    <Eye className="size-4" /> Preview Email
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isSendingEmails || !event.meeting_link || event.status !== 'published'}
                    className="flex items-center gap-1.5"
                  >
                    {isSendingEmails ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {event.meeting_link_sent_at ? 'Resend to All' : 'Send to Registered'}
                  </Button>
                </div>
              </div>

              {/* Archive Details Section */}
              <div className="pt-6 border-t border-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Layers className="size-4 text-emerald-400" /> Archive Details
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="page-recording-url-youtube-loom" className="text-[10px] font-mono text-slate-500 uppercase">Recording URL (YouTube/Loom)</label>
                    <input id="page-recording-url-youtube-loom" 
                      type="url"
                      value={event.recording_url || ''}
                      onChange={async (e) => {
                        const val = e.target.value;
                        setEvent({...event, recording_url: val});
                        await api(`/admin/events/${id}/archive`, {
                          method: 'PATCH',
                          body: JSON.stringify({ recording_url: val }),
                        }).catch(() => {});
                      }}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-900 rounded px-3 py-1.5 text-xs text-slate-300 font-mono focus:border-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="page-archive-summary-post-event-recap" className="text-[10px] font-mono text-slate-500 uppercase">Archive Summary (Post-event recap)</label>
                    <textarea id="page-archive-summary-post-event-recap" 
                      value={event.summary || ''}
                      onChange={async (e) => {
                        const val = e.target.value;
                        setEvent({...event, summary: val});
                        await api(`/admin/events/${id}/archive`, {
                          method: 'PATCH',
                          body: JSON.stringify({ summary: val }),
                        }).catch(() => {});
                      }}
                      placeholder="Relive the session highlights&hellip;"
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-900 rounded px-3 py-2 text-xs text-slate-300 focus:border-emerald-500/30 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Registrations List Mini-table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Users className="size-5 text-emerald-400" /> Attendees ({registrations.length})
              </h2>
              <Link href={`/admin/events/${id}/registrations`}>
                <Button variant="outline" size="sm" className="text-[10px] font-mono h-auto py-1.5">
                  View Full Roster
                </Button>
              </Link>
            </div>
            
            <Card className="border-slate-900 p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/60 font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                      <th className="py-3 px-6 font-semibold">Student Name</th>
                      <th className="py-3 px-6 font-semibold">Email</th>
                      <th className="py-3 px-6 font-semibold text-right">Time Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                    {registrations.slice(0, 5).map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-3 px-6 font-semibold text-white">{reg.full_name}</td>
                        <td className="py-3 px-6 text-slate-400 font-mono text-[11px]">{reg.email}</td>
                        <td className="py-3 px-6 text-right text-slate-500 font-mono text-[10px]">
                          {new Date(reg.registered_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {registrations.length > 5 && (
                      <tr>
                        <td colSpan={3} className="py-3 px-6 text-center text-[10px] text-slate-500 font-mono bg-slate-900/10">
                          + {registrations.length - 5} more registrations&hellip;
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Event Info Cards */}
        <div className="space-y-6">
          <Card className="border-slate-800 bg-slate-950/40 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest text-slate-400">Event Snapshot</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="text-xs text-slate-500">Type</span>
                <span className="text-xs font-mono text-white capitalize">{event.event_type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="text-xs text-slate-500">Mode</span>
                <span className="text-xs font-mono text-white capitalize">{event.mode}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-900">
                <span className="text-xs text-slate-500">Date</span>
                <span className="text-xs font-mono text-white">{new Date(event.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-500">Total RSVPs</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">{registrations.length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* --- Modals --- */}

      {/* 1. Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col my-8">
            <div className="bg-slate-100 p-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-slate-600" />
                <span className="text-sm font-bold text-slate-800">Email Preview: Meeting Link Announcement</span>
              </div>
              <button type="button" 
                onClick={() => setShowPreview(false)}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Terminal className="size-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[70vh] bg-slate-50 flex justify-center">
              <div className="w-full max-w-[600px] shadow-sm">
                <MeetingLinkEmail
                  studentName="[Student Name]"
                  eventTitle={event.title}
                  eventDate={new Date(event.date).toLocaleDateString()}
                  eventTime={`${event.start_time} - ${event.end_time}`}
                  meetingLink={meetingLink || 'https://meet.google.com/example'}
                />
              </div>
            </div>

            <div className="bg-slate-100 p-4 flex justify-end gap-3 border-t border-slate-200">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPreview(false)}
                className="text-slate-600 border-slate-300 hover:bg-slate-200"
              >
                Close Preview
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => {
                  setShowPreview(false);
                  setShowConfirmModal(true);
                }}
              >
                Send to All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <Card className="max-w-md w-full border-slate-800 bg-slate-950 p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="p-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Send className="size-6" />
              </div>
              <h2 className="text-xl font-bold text-white font-mono">Blast Meeting Link?</h2>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-400 leading-relaxed">
                You are about to send the meeting link email to <strong>{registrations.length} registered students</strong> for:
              </p>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <p className="text-xs font-bold text-white mb-1">{event.title}</p>
                <p className="text-[10px] text-emerald-500 font-mono">{meetingLink}</p>
              </div>
              {event.meeting_link_sent_at && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="size-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-400 leading-relaxed font-mono">
                    Warning: Links were already sent on {new Date(event.meeting_link_sent_at).toLocaleString()}. 
                    Are you sure you want to resend?
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
              <Button 
                variant="secondary" 
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={() => handleSendEmails(!!event.meeting_link_sent_at)}
                className="flex items-center gap-2"
              >
                {event.meeting_link_sent_at ? 'Resend to All' : 'Send Blast Now'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
