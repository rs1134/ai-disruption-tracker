'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  lastRefreshed: string | null;
  onRefresh: () => void;
  intervalMs?: number;
}

export default function AutoRefreshIndicator({
  lastRefreshed,
  onRefresh,
  intervalMs = 30 * 60 * 1000, // 30 min
}: Props) {
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(intervalMs / 1000);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          handleRefresh();
          return intervalMs / 1000;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [intervalMs]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setSecondsUntilRefresh(intervalMs / 1000);
    }
  }

  const minutes = Math.floor(secondsUntilRefresh / 60);
  const seconds = secondsUntilRefresh % 60;
  const progressPct = ((intervalMs / 1000 - secondsUntilRefresh) / (intervalMs / 1000)) * 100;

  return (
    <div className="flex items-center gap-3">
      {lastRefreshed && (
        <span className="text-[11px] text-slate-500 hidden sm:block">
          Updated {new Date(lastRefreshed).toLocaleTimeString()}
        </span>
      )}

      <div className="flex items-center gap-2 bg-surface-card border border-surface-border rounded-lg px-3 py-1.5">
        {/* Progress ring */}
        <div className="relative w-4 h-4">
          <svg className="w-4 h-4 -rotate-90" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" fill="none" stroke="#1e2436" strokeWidth="2" />
            <circle
              cx="8" cy="8" r="6"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 6}`}
              strokeDashoffset={`${2 * Math.PI * 6 * (1 - progressPct / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
        </div>

        <span className="text-[11px] text-slate-400 font-mono tabular-nums">
          {minutes > 0 ? `${minutes}m ` : ''}{String(seconds).padStart(2, '0')}s
        </span>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-slate-500 hover:text-blue-400 transition-colors disabled:opacity-40"
          title="Refresh now"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
