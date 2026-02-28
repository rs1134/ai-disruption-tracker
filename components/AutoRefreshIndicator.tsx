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
  intervalMs = 30 * 60 * 1000,
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

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-40"
      title={lastRefreshed ? `Last updated ${new Date(lastRefreshed).toLocaleTimeString()}` : 'Refresh now'}
    >
      <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span className="text-[10px] font-mono tabular-nums hidden sm:block">
        {minutes > 0 ? `${minutes}m ` : ''}{String(seconds).padStart(2, '0')}s
      </span>
    </button>
  );
}
