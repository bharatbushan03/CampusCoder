'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Calendar, MapPin, Clock, ArrowRight, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { placeholderEvents } from '@/lib/placeholderData';

export default function EventsListingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const categories = [
    { label: 'All Sprints', value: 'all' },
    { label: 'Workshops', value: 'workshop' },
    { label: 'Coding Sessions', value: 'coding_session' },
    { label: 'Placement Prep', value: 'placement_prep' },
    { label: 'Hackathons', value: 'hackathon' },
  ];

  // Filtering logic
  const filteredEvents = placeholderEvents.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'all' || event.type === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="tech-grid min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="max-w-3xl mb-12">
          <h1 className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">
            // Campus Events
          </h1>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Workshops & Coding Sessions
          </h2>
          <p className="mt-4 text-slate-400">
            Register for developer sprints, interactive workshops, placement training, and competitive programming matches. Secure your virtual or in-person seat.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 p-6 bg-slate-900/40 border border-slate-900 rounded-xl backdrop-blur-md">
          {/* Categories Tab list */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedType(cat.value)}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-medium border transition-all duration-200 cursor-pointer ${
                  selectedType === cat.value
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search topics or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Dynamic Event Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="flex flex-col justify-between h-full group hover:border-emerald-500/30">
                <div>
                  {/* Category and Available seats info */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 capitalize">
                      {event.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {event.seatsTotal - event.seatsRegistered} / {event.seatsTotal} seats remaining
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                    {event.title}
                  </h3>
                  
                  <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                    {event.description}
                  </p>

                  {/* Metadata labels */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-950">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-950">
                      <Clock className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      <span>{event.time}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {event.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-mono bg-slate-950/90 text-slate-500 border border-slate-800 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Speaker card & Register buttons */}
                <div className="pt-6 border-t border-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <User className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-300">{event.speaker.name}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{event.speaker.role}</p>
                    </div>
                  </div>

                  <Link href={`/events/${event.id}`} className="w-full sm:w-auto">
                    <Button variant="secondary" size="sm" className="w-full sm:w-auto flex items-center justify-center gap-1 group-hover:bg-slate-800">
                      Details & RSVP <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-900 rounded-xl">
            <p className="text-slate-400 font-mono text-sm mb-4">No sprints found matching filters.</p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSelectedType('all'); }}>
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
