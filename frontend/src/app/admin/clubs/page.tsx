'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Shield,
  PlusCircle,
  Search,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit,
  Loader2,
  Sparkles,
  Info,
  Building2,
  Filter,
  Eye,
  Mail,
  School,
  GraduationCap,
  X,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CampusCoderLoader } from '@/components/ui/CampusCoderLoader';

export interface ClubOrganizer {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  college: string | null;
  branch: string | null;
  year: string | null;
  created_at?: string;
}

export interface ClubItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organizersCount?: number;
  eventsCount?: number;
  organizers?: ClubOrganizer[];
}

export default function AdminClubsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingClub, setEditingClub] = useState<ClubItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Appoint Organizer State
  const [appointModalClub, setAppointModalClub] = useState<ClubItem | null>(null);
  const [candidates, setCandidates] = useState<Array<{ id: string; full_name: string | null; email: string | null; college: string | null; branch: string | null; year: string | null }>>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [appointSubmitting, setAppointSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected Club Details (with organizers)
  const [selectedClubDetails, setSelectedClubDetails] = useState<{
    club: ClubItem;
    events: any[];
    organizer_count: number;
    can_view_organizers: boolean;
    organizers: ClubOrganizer[];
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modal Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'Technical',
    is_active: true,
  });

  const isGlobalAdmin = profile?.role === 'admin';
  const userClubId = profile?.club_id;
  const userClubName = profile?.club?.name || 'Your Club';

  const loadClubs = async () => {
    try {
      const data = await api<{ ok: boolean; clubs: ClubItem[] }>('/clubs/admin/all').catch(() =>
        api<{ ok: boolean; clubs: ClubItem[] }>('/clubs')
      );
      if (data?.clubs) {
        setClubs(data.clubs);
      }
    } catch (err: any) {
      console.warn('Error loading clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewClubDetails = async (club: ClubItem) => {
    setSelectedClubDetails({
      club,
      events: [],
      organizer_count: club.organizers?.length ?? 0,
      can_view_organizers: true,
      organizers: club.organizers || [],
    });
    setLoadingDetails(true);
    try {
      const res = await api<{
        ok: boolean;
        club: ClubItem;
        events: any[];
        organizer_count: number;
        can_view_organizers: boolean;
        organizers: ClubOrganizer[];
      }>(`/clubs/${club.slug}/details`);
      if (res?.ok) {
        setSelectedClubDetails(res);
      }
    } catch (err: any) {
      console.warn('Failed to load club details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openAppointModal = async (club: ClubItem) => {
    setAppointModalClub(club);
    setSelectedCandidateId('');
    setLoadingCandidates(true);
    try {
      const res = await api<{ ok: boolean; students: any[] }>('/clubs/admin/candidates').catch(() =>
        api<{ ok: boolean; profiles: any[] }>('/admin/students')
      );
      const studentList = (res as any)?.students || (res as any)?.profiles || [];
      setCandidates(studentList);
      if (studentList.length > 0) {
        setSelectedCandidateId(studentList[0].id);
      }
    } catch (err: any) {
      console.warn('Failed to load candidate students:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleAppointOrganizer = async () => {
    if (!appointModalClub || !selectedCandidateId) return;
    setAppointSubmitting(true);
    try {
      const res = await api<{ ok: boolean; organizer: ClubOrganizer }>(`/clubs/admin/${appointModalClub.id}/organizers`, {
        method: 'POST',
        body: JSON.stringify({ studentId: selectedCandidateId }),
      });
      if (res?.ok && res.organizer) {
        const newOrg = res.organizer;
        setClubs((prev) =>
          prev.map((c) => {
            if (c.id !== appointModalClub.id) return c;
            const updatedOrgs = [...(c.organizers || []), newOrg];
            return {
              ...c,
              organizers: updatedOrgs,
              organizersCount: updatedOrgs.length,
            };
          })
        );

        if (selectedClubDetails && selectedClubDetails.club.id === appointModalClub.id) {
          const updatedOrgs = [...(selectedClubDetails.organizers || []), newOrg];
          setSelectedClubDetails({
            ...selectedClubDetails,
            organizers: updatedOrgs,
            organizer_count: updatedOrgs.length,
          });
        }

        setActionFeedback({
          type: 'success',
          text: `${newOrg.full_name || newOrg.email} is now an organizer for ${appointModalClub.name}!`,
        });
        setTimeout(() => setActionFeedback(null), 4000);
        setAppointModalClub(null);
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        text: err.message || 'Failed to appoint organizer',
      });
    } finally {
      setAppointSubmitting(false);
    }
  };

  const handleRemoveOrganizer = async (clubId: string, organizerId: string, orgName: string) => {
    if (!confirm(`Remove ${orgName} as organizer? They will return to being a regular student.`)) return;
    try {
      await api(`/clubs/admin/${clubId}/organizers/${organizerId}`, {
        method: 'DELETE',
      });

      setClubs((prev) =>
        prev.map((c) => {
          if (c.id !== clubId) return c;
          const updatedOrgs = (c.organizers || []).filter((o) => o.id !== organizerId);
          return {
            ...c,
            organizers: updatedOrgs,
            organizersCount: updatedOrgs.length,
          };
        })
      );

      if (selectedClubDetails && selectedClubDetails.club.id === clubId) {
        const updatedOrgs = selectedClubDetails.organizers.filter((o) => o.id !== organizerId);
        setSelectedClubDetails({
          ...selectedClubDetails,
          organizers: updatedOrgs,
          organizer_count: updatedOrgs.length,
        });
      }

      setActionFeedback({
        type: 'success',
        text: `${orgName} was removed from club organizers and reverted to student.`,
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        text: err.message || 'Failed to remove organizer',
      });
    }
  };

  useEffect(() => {
    loadClubs();
  }, []);

  const openCreateModal = () => {
    setEditingClub(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      category: 'Technical',
      is_active: true,
    });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (club: ClubItem) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      slug: club.slug,
      description: club.description || '',
      category: club.category || 'Technical',
      is_active: club.is_active,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      setFormError('Club name and slug are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingClub) {
        await api(`/clubs/admin/${editingClub.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await api('/clubs/admin', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      await loadClubs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save club');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(clubs.map((c) => c.category).filter(Boolean)))];

  const filteredClubs = clubs.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <CampusCoderLoader text="Loading Clubs & Communities..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Clubs & Communities
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Role-based community scoping for events, student access, and campus engagement.
          </p>
        </div>

        {isGlobalAdmin && (
          <Button
            onClick={openCreateModal}
            variant="primary"
            className="flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            <PlusCircle className="size-4" /> Add Club
          </Button>
        )}
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{actionFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search clubs by name, slug or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="size-3.5 text-slate-500 shrink-0 hidden sm:block mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clubs Grid */}
      {filteredClubs.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-800">
          <Building2 className="size-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No clubs found matching your criteria</p>
          <p className="text-xs text-slate-500 mt-1">Try refining your search query or category filter.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClubs.map((club) => {
            const isUserClub = userClubId === club.id;
            return (
              <Card
                key={club.id}
                className={`relative flex flex-col justify-between p-5 border transition-all ${
                  isUserClub
                    ? 'bg-emerald-950/10 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                {/* Header Tags */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50">
                      {club.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isUserClub && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Your Club
                        </span>
                      )}
                      {club.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="size-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <XCircle className="size-3.5" /> Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Club Title & Slug */}
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {club.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">slug: {club.slug}</p>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-3 mt-3 leading-relaxed">
                    {club.description || 'No description provided for this club.'}
                  </p>

                  {/* Community Organizers Section */}
                  <div className="pt-3 mt-3 border-t border-slate-800/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 font-semibold">
                        <Users className="size-3.5 text-emerald-400" />
                        Community Organizers ({club.organizers?.length ?? club.organizersCount ?? 0})
                      </span>
                      {isGlobalAdmin && (
                        <button
                          type="button"
                          onClick={() => openAppointModal(club)}
                          className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <UserPlus className="size-3" /> Add
                        </button>
                      )}
                    </div>

                    {club.organizers && club.organizers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {club.organizers.map((org) => (
                          <span
                            key={org.id}
                            className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-200"
                            title={`${org.full_name || org.email} (${org.college || 'Campus'})`}
                          >
                            <span className="size-1.5 rounded-full bg-emerald-400"></span>
                            {org.full_name || org.email?.split('@')[0]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] font-mono text-slate-500 italic">No organizers assigned yet</p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => viewClubDetails(club)}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-md transition-colors cursor-pointer"
                  >
                    <Eye className="size-3.5" /> Club Details
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/events?club=${club.slug}`}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                      title="View events belonging to this club"
                    >
                      <Calendar className="size-3.5" /> Events
                    </Link>

                    {isGlobalAdmin && (
                      <button
                        onClick={() => openEditModal(club)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit Club Details"
                      >
                        <Edit className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal (Admin Only) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">
              {editingClub ? 'Edit Club' : 'Create New Club'}
            </h2>

            {formError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Club Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI & Machine Learning Club"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = !editingClub
                      ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                      : formData.slug;
                    setFormData({ ...formData, name, slug: autoSlug });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Slug (URL identifier) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. aiml-club"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="Technical">Technical</option>
                  <option value="Development">Development</option>
                  <option value="Security">Security</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Core">Core</option>
                  <option value="Special Interest">Special Interest</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of the club's mission and activities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="club-is-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950 size-4"
                />
                <label htmlFor="club-is-active" className="text-xs text-slate-300">
                  Active (visible across the platform)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="size-4 animate-spin" /> Saving...
                    </span>
                  ) : editingClub ? (
                    'Save Changes'
                  ) : (
                    'Create Club'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Club Details & Organizers Modal */}
      {selectedClubDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {selectedClubDetails.club.category}
                  </span>
                  {selectedClubDetails.club.is_active ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="size-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <XCircle className="size-3" /> Inactive
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
                  <Shield className="size-6 text-emerald-400" />
                  {selectedClubDetails.club.name}
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5">slug: {selectedClubDetails.club.slug}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClubDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Description */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-lg p-3.5">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">Mission & Overview</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedClubDetails.club.description || 'No description provided for this club.'}
              </p>
            </div>

            {/* Organizers Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                    <Users className="size-4 text-emerald-400" />
                    Community Organizers
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Chapter officers and student organizers leading {selectedClubDetails.club.name}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    {selectedClubDetails.organizers.length} Organizer{selectedClubDetails.organizers.length === 1 ? '' : 's'}
                  </span>
                  {isGlobalAdmin && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openAppointModal(selectedClubDetails.club)}
                      className="text-xs font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="size-3.5" /> Appoint Organizer
                    </Button>
                  )}
                </div>
              </div>

              {loadingDetails ? (
                <div className="py-8 text-center">
                  <Loader2 className="size-6 text-emerald-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs font-mono text-slate-400">Loading organizer roster...</p>
                </div>
              ) : selectedClubDetails.organizers.length === 0 ? (
                <div className="text-center py-6 bg-slate-900/30 border border-dashed border-slate-800 rounded-lg">
                  <p className="text-xs font-mono text-slate-400">No organizers currently assigned to {selectedClubDetails.club.name}.</p>
                  {isGlobalAdmin && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Click &ldquo;Appoint Organizer&rdquo; to select a registered student to lead this chapter.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedClubDetails.organizers.map((org) => (
                    <div
                      key={org.id}
                      className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-white">{org.full_name || 'Unnamed Organizer'}</p>
                          <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Mail className="size-3" /> {org.email}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                          {selectedClubDetails.club.name} Organizer
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono space-y-0.5 pt-1 border-t border-slate-800/60">
                        {org.college && (
                          <p className="flex items-center gap-1 truncate">
                            <School className="size-3 text-slate-500" /> {org.college}
                          </p>
                        )}
                        {(org.branch || org.year) && (
                          <p className="flex items-center gap-1">
                            <GraduationCap className="size-3 text-slate-500" /> {org.branch || '—'} • Year {org.year || '—'}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/40">
                        {isGlobalAdmin ? (
                          <Link
                            href={`/admin/students/${org.id}`}
                            className="text-[11px] text-sky-400 hover:text-sky-300 font-mono inline-flex items-center gap-1"
                          >
                            Edit profile →
                          </Link>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Chapter Leadership</span>
                        )}

                        {isGlobalAdmin && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOrganizer(selectedClubDetails.club.id, org.id, org.full_name || org.email || 'Organizer')}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-mono p-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove as organizer (revert to student)"
                          >
                            <Trash2 className="size-3" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Club Events */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                  <Calendar className="size-4 text-emerald-400" />
                  Events Hosted by {selectedClubDetails.club.name} ({selectedClubDetails.events.length})
                </h3>
                <Link
                  href={`/admin/events?club=${selectedClubDetails.club.slug}`}
                  className="text-xs text-emerald-400 hover:underline font-mono"
                >
                  Manage all →
                </Link>
              </div>

              {selectedClubDetails.events.length === 0 ? (
                <p className="text-xs font-mono text-slate-500">No events hosted by this club yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedClubDetails.events.slice(0, 5).map((ev: any) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-white">{ev.title}</p>
                        <p className="text-[11px] font-mono text-slate-500">
                          {ev.date} @ {ev.start_time} • {ev.mode}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border capitalize ${
                        ev.status === 'published' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        {ev.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setSelectedClubDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Appoint Organizer Modal (Admin Only) */}
      {appointModalClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <UserPlus className="size-5 text-emerald-400" />
                  Appoint {appointModalClub.name} Organizer
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assign a registered student to be an official community organizer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAppointModalClub(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {loadingCandidates ? (
              <div className="py-6 text-center space-y-2">
                <Loader2 className="size-6 text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs font-mono text-slate-400">Loading student directory...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-slate-400 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                No eligible students found in the directory.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Select Student
                  </label>
                  <select
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                  >
                    {candidates.map((cand) => (
                      <option key={cand.id} value={cand.id}>
                        {cand.full_name || cand.email} ({cand.email})
                        {cand.college ? ` — ${cand.college}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-[11px] text-slate-400 font-mono bg-slate-950/50 p-2.5 rounded border border-slate-800">
                  Once appointed, this student will become an organizer for {appointModalClub.name} and can manage chapter events and RSVPs.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setAppointModalClub(null)}
                    disabled={appointSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAppointOrganizer}
                    disabled={appointSubmitting || !selectedCandidateId}
                    className="flex items-center gap-1.5"
                  >
                    {appointSubmitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Appointing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        Confirm Appointment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
