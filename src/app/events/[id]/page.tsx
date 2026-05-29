'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, Clock, MapPin, ArrowLeft, Users, User, ArrowRight, CheckCircle } from 'lucide-react';
import { placeholderEvents } from '@/lib/placeholderData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function EventDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  
  // Find event
  const event = placeholderEvents.find((ev) => ev.id === id);

  if (!event) {
    return (
      <div className="tech-grid min-h-screen flex items-center justify-center py-20 px-4">
        <Card className="text-center max-w-md p-8 border-red-500/20">
          <h2 className="text-2xl font-bold text-white mb-2">Event Not Found</h2>
          <p className="text-slate-400 mb-6">The requested sprint ID does not exist or has been archived.</p>
          <Link href="/events">
            <Button variant="primary">Return to Events</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Calculate percentage of seats registered
  const fillPercentage = Math.round((event.seatsRegistered / event.seatsTotal) * 100);

  return (
    <div className="tech-grid min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link href="/events" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Back to all events
        </Link>

        {/* Layout: Main column & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card hoverEffect={false} className="p-8">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 capitalize mb-4 inline-block">
                {event.type.replace('_', ' ')}
              </span>
              
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-2 mb-4 leading-tight">
                {event.title}
              </h1>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 py-4 border-y border-slate-900">
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Date</p>
                    <p className="font-medium">{new Date(event.date).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Time</p>
                    <p className="font-medium">{event.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Location</p>
                    <p className="font-medium truncate max-w-[160px]">{event.location}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-invert max-w-none space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">About this Session</h3>
                <p className="text-slate-300 leading-relaxed">
                  {event.longDescription || event.description}
                </p>
              </div>

              {/* Tags */}
              <div className="mt-8 flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span key={tag} className="text-xs font-mono bg-slate-950/80 text-emerald-400/80 border border-slate-800 px-3 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </Card>

            {/* Speaker Information Card */}
            <Card hoverEffect={false} className="p-8">
              <h3 className="text-lg font-bold text-white mb-6">About the Speaker</h3>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <User className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{event.speaker.name}</h4>
                  <p className="text-sm text-emerald-400/80 font-medium mb-2">{event.speaker.role}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Seniors and industry mentors volunteering to build coding competencies and bridge knowledge gaps on campus.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar Drawer / Registration Portal */}
          <div className="space-y-6">
            <Card hoverEffect={false} className="border-emerald-500/20 bg-slate-900 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Registration</h3>
              
              {/* Registration count progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                  <span>Available Seats</span>
                  <span className="font-semibold text-emerald-400">
                    {event.seatsTotal - event.seatsRegistered} of {event.seatsTotal} left
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${fillPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* RSVP info bullets */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Free entry for campus students</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Interactive Live Q&A</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Link will be shared via Email</span>
                </div>
              </div>

              {/* CTA button */}
              <Link href={`/register?eventId=${event.id}`} className="block">
                <Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2">
                  Register for Event <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Card>

            <Card hoverEffect={false} className="p-6">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-500 mb-4">Need Help?</h4>
              <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                Problems registering or joining online? Connect with our support handles or ping the #support voice channel in Discord.
              </p>
              <a href="#" className="text-xs text-emerald-400 font-semibold hover:underline">
                Visit CampusCoder Discord &rarr;
              </a>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
