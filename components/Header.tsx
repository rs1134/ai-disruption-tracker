'use client';

import Link from 'next/link';
import { Zap, Settings } from 'lucide-react';
import AutoRefreshIndicator from './AutoRefreshIndicator';

interface Props {
  lastRefreshed: string | null;
  onRefresh: () => void;
}

export default function Header({ lastRefreshed, onRefresh }: Props) {
  return (
    <header className="bg-slate-900 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-white font-bold text-[15px] tracking-tight">
              AI Disruption
            </span>
            <span className="text-indigo-400 font-bold text-[15px] tracking-tight ml-1">
              Tracker
            </span>
          </div>
        </Link>

        {/* Live badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-400 font-semibold tracking-wide">LIVE</span>
        </div>

        {/* Right: refresh + admin */}
        <div className="flex items-center gap-3 ml-auto">
          <AutoRefreshIndicator lastRefreshed={lastRefreshed} onRefresh={onRefresh} />
          <Link
            href="/admin"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Admin dashboard"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
