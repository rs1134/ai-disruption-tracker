'use client';

import Link from 'next/link';
import { Brain, Settings } from 'lucide-react';
import AutoRefreshIndicator from './AutoRefreshIndicator';

interface Props {
  lastRefreshed: string | null;
  onRefresh: () => void;
}

export default function Header({ lastRefreshed, onRefresh }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
              <Brain className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">
                AI Disruption
              </span>
              <span className="text-sm font-bold text-blue-400 tracking-tight ml-1">
                Tracker
              </span>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <AutoRefreshIndicator
              lastRefreshed={lastRefreshed}
              onRefresh={onRefresh}
            />
            <Link
              href="/admin"
              className="w-8 h-8 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors"
              title="Admin dashboard"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
