'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import AutoRefreshIndicator from './AutoRefreshIndicator';

interface Props {
  lastRefreshed: string | null;
  onRefresh: () => void;
}

const SECTIONS = ['Layoffs', 'Funding', 'Product Launch', 'Regulation', 'Breakthrough', 'Acquisition'];

export default function Header({ lastRefreshed, onRefresh }: Props) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-rule sticky top-0 z-50">
      {/* Top utility bar */}
      <div className="bg-ink border-b border-ink/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          <span className="text-[11px] text-white/60 font-sans tracking-wide">{today}</span>
          <div className="flex items-center gap-4">
            <AutoRefreshIndicator lastRefreshed={lastRefreshed} onRefresh={onRefresh} />
            <Link
              href="/admin"
              className="text-white/50 hover:text-white/90 transition-colors"
              title="Admin dashboard"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="border-b border-rule-heavy py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link href="/" className="inline-block group">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-ink tracking-tight leading-none">
              The AI Disruption Tracker.
            </h1>
            <p className="text-[11px] text-ink-muted font-sans uppercase tracking-[0.15em] mt-1">
              Highest-engagement AI news · Updated daily
            </p>
          </Link>
        </div>
      </div>

      {/* Red rule */}
      <div className="h-[3px] bg-wsj-red" />

      {/* Section nav */}
      <div className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-0 overflow-x-auto scrollbar-none">
            {SECTIONS.map((section) => (
              <span
                key={section}
                className="text-[12px] font-sans font-semibold text-ink-secondary hover:text-wsj-red
                           cursor-default px-3 py-2.5 whitespace-nowrap border-r border-rule
                           first:pl-0 last:border-r-0 transition-colors"
              >
                {section}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
