'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Feed from '@/components/Feed';
import Sidebar from '@/components/Sidebar';
import DisruptionHighlight from '@/components/DisruptionHighlight';
import type { FeedItem, SidebarStats } from '@/types';

export default function HomePage() {
  const [sidebarStats, setSidebarStats] = useState<SidebarStats | null>(null);
  const [topDisruption, setTopDisruption] = useState<FeedItem | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [feedCounts, setFeedCounts] = useState({ all: 0, tweet: 0, news: 0 });

  async function loadSidebar() {
    try {
      const [trendingRes, topRes] = await Promise.all([
        fetch('/api/trending'),
        fetch('/api/top-disruption'),
      ]);
      const [trendingData, topData] = await Promise.all([
        trendingRes.json(),
        topRes.json(),
      ]);
      setSidebarStats(trendingData.data ?? null);
      setTopDisruption(topData.data ?? null);
    } catch {
      // Fail silently – sidebar is non-critical
    } finally {
      setSidebarLoading(false);
    }
  }

  useEffect(() => { loadSidebar(); }, []);

  const handleRefresh = useCallback(async () => {
    // Re-fetch sidebar after main feed refreshes
    await loadSidebar();
  }, []);

  return (
    <div className="min-h-screen">
      <Header
        lastRefreshed={sidebarStats?.lastRefreshed ?? null}
        onRefresh={handleRefresh}
      />

      {/* Hero */}
      <div className="relative border-b border-surface-border bg-hero-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Live · Updates every 30 min
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
              AI Disruption{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Tracker
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Top AI disruptions in the last 24 hours — highest-engagement{' '}
              <span className="text-slate-300">X posts</span> and{' '}
              <span className="text-slate-300">breaking news</span> on layoffs, funding,
              product launches, regulations, and breakthroughs.
            </p>

            {/* Quick stats */}
            {feedCounts.all > 0 && (
              <div className="flex items-center gap-4 mt-5 text-sm">
                <span className="text-slate-400">
                  <span className="text-white font-semibold">{feedCounts.all}</span> items
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">
                  <span className="text-blue-400 font-semibold">{feedCounts.tweet}</span> X posts
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">
                  <span className="text-purple-400 font-semibold">{feedCounts.news}</span> articles
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Feed column */}
          <div className="flex-1 min-w-0">
            <DisruptionHighlight item={topDisruption} />
            <Feed onCountsChange={setFeedCounts} />
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20">
              <Sidebar stats={sidebarStats} loading={sidebarLoading} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between gap-3 text-xs text-slate-600">
          <p>AI Disruption Tracker · Data refreshed every 30 minutes · Past 24 hours only</p>
          <p>Powered by X API v2 · NewsAPI · Next.js · Neon PostgreSQL</p>
        </div>
      </footer>
    </div>
  );
}
