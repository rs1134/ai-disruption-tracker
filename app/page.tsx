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
    await loadSidebar();
  }, []);

  return (
    <div className="min-h-screen bg-paper font-sans">
      <Header
        lastRefreshed={sidebarStats?.lastRefreshed ?? null}
        onRefresh={handleRefresh}
      />

      {/* Subheading bar — count stats */}
      {feedCounts.all > 0 && (
        <div className="border-b border-rule bg-paper-warm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-4 text-[11px] text-ink-light font-sans">
            <span>
              <span className="font-semibold text-ink">{feedCounts.all}</span> items today
            </span>
            <span className="text-rule">|</span>
            <span>
              <span className="font-semibold text-ink">{feedCounts.tweet}</span> Reddit &amp; HN
            </span>
            <span className="text-rule">|</span>
            <span>
              <span className="font-semibold text-ink">{feedCounts.news}</span> news articles
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-10">
          {/* Primary feed column */}
          <div className="flex-1 min-w-0">
            <DisruptionHighlight item={topDisruption} />
            <Feed onCountsChange={setFeedCounts} />
          </div>

          {/* Sidebar — right rail */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-[108px]">
              {/* Divider line on left */}
              <div className="pl-6 border-l border-rule">
                <Sidebar stats={sidebarStats} loading={sidebarLoading} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink mt-16 pt-4 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between gap-2 text-[11px] text-ink-light font-sans">
            <p className="font-semibold text-ink">The AI Disruption Tracker</p>
            <p>Data refreshed daily · Past 24 hours only · Powered by Reddit, HN &amp; RSS · Next.js &amp; Neon</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
