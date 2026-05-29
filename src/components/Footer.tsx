import React from 'react';
import Link from 'next/link';
import { Terminal, Globe, Code } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-emerald-500/10 bg-slate-950 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <Terminal className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="font-mono text-lg font-bold tracking-tight text-white">
                Campus<span className="text-emerald-500 font-sans">Coder</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm mb-4 leading-relaxed">
              A student-led virtual coding community designed to bridge the gap between academics, modern software craftsmanship, and competitive career opportunities.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors" aria-label="Github">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors" aria-label="Slack">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.522 2.522v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.522-2.522V8.824a2.528 2.528 0 0 1 2.522-2.52h5.043zm10.135 3.797a2.528 2.528 0 0 1 2.522-2.52 2.528 2.528 0 0 1 2.52 2.52v2.52h-2.52a2.528 2.528 0 0 1-2.522-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V3.78a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043zm-3.781 10.135a2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.522-2.522v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.522 2.522v5.043a2.528 2.528 0 0 1-2.522 2.52h-5.043z" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors" aria-label="Website">
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  Registration Portal
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  Discord Server
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  Open Source Projects
                </a>
              </li>
            </ul>
          </div>

          {/* Developer / Admin */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  Member Portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  HackerRank Preparation
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  System Design Guide
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} CampusCoder Community. All rights reserved.
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            Made with <Code className="h-3.5 w-3.5 text-emerald-500" /> for student builders.
          </p>
        </div>
      </div>
    </footer>
  );
};
