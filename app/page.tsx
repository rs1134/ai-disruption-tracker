'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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
  // Incrementing this key remounts <Feed>, forcing a fresh /api/posts fetch
  const [feedKey, setFeedKey] = useState(0);

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
    await loadSidebar();
    // Remount Feed so it discards the in-memory cache and re-fetches /api/posts
    setFeedKey((k) => k + 1);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        lastRefreshed={sidebarStats?.lastRefreshed ?? null}
        onRefresh={handleRefresh}
      />

      {/* Sub-header: live stats bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-semibold text-slate-800">
              Today&rsquo;s AI Disruptions
            </h2>
            {feedCounts.all > 0 && (
              <span className="text-[11px] text-slate-400 font-medium">
                — {feedCounts.all} stories from Reddit, HN &amp; news
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-[12px] text-slate-500">
            {feedCounts.tweet > 0 && (
              <span>
                <span className="font-semibold text-slate-700">{feedCounts.tweet}</span> social
              </span>
            )}
            {feedCounts.news > 0 && (
              <span>
                <span className="font-semibold text-slate-700">{feedCounts.news}</span> articles
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Primary feed column */}
          <div className="flex-1 min-w-0">
            <DisruptionHighlight item={topDisruption} />
            <Feed key={feedKey} onCountsChange={setFeedCounts} />
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <Sidebar stats={sidebarStats} loading={sidebarLoading} />
          </div>
        </div>
      </main>

      {/* Compare page promo banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Link
          href="/compare"
          className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl px-6 py-5 hover:from-indigo-500 hover:to-violet-500 transition-all group shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-3xl">
              <span>🇺🇸</span>
              <span className="text-white/40 text-xl font-bold">vs</span>
              <span>🇨🇳</span>
            </div>
            <div>
              <p className="text-white font-black text-[16px]">US vs China AI Comparison</p>
              <p className="text-indigo-200 text-[12px]">
                Live Arena Elo · Category leaderboards · Funding · Timeline
              </p>
            </div>
          </div>
          <span className="flex-shrink-0 flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-[13px] px-4 py-2 rounded-xl transition-colors">
            View Full Comparison →
          </span>
        </Link>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 mt-4 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-bold text-sm">AI Disruption Tracker</span>
              </div>
              <p className="text-slate-400 text-[12px]">
                Top AI disruptions in the last 24 hours, updated daily.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 text-left sm:text-right">
              <p>Powered by Reddit · Hacker News · RSS Feeds</p>
              <p className="mt-0.5">Built with Next.js &amp; Neon PostgreSQL</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
