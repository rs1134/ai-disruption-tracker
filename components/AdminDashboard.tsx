'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, BarChart2, Database, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AdminStats, Category, Sentiment } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  Layoffs: 'bg-red-500',
  Funding: 'bg-emerald-600',
  'Product Launch': 'bg-blue-500',
  Regulation: 'bg-amber-500',
  Breakthrough: 'bg-purple-500',
  Acquisition: 'bg-cyan-600',
  General: 'bg-ink-muted',
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-emerald-600',
  negative: 'bg-red-600',
  neutral: 'bg-ink-faint',
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
  if (status === 'error') return <XCircle className="w-3.5 h-3.5 text-red-600" />;
  return <AlertCircle className="w-3.5 h-3.5 text-amber-600" />;
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-ink-secondary font-sans w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-rule overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-ink-light font-mono w-8 text-right">{value}</span>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b-2 border-ink mb-4">
      <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-ink pb-1">
        {children}
      </h3>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data.data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function triggerRefresh() {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch('/api/admin/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setRefreshMsg(`Refreshed: +${data.results?.tweets ?? 0} social posts, +${data.results?.news ?? 0} articles`);
        await fetchStats();
      } else {
        setRefreshMsg(`Error: ${data.error}`);
      }
    } catch (err) {
      setRefreshMsg(`Error: ${(err as Error).message}`);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchStats(); }, []);

  const categoryEntries = Object.entries(stats?.categoryBreakdown ?? {}) as [Category, number][];
  const maxCategory = Math.max(...categoryEntries.map(([, v]) => v), 1);

  const sentimentEntries = Object.entries(stats?.sentimentBreakdown ?? {}) as [Sentiment, number][];
  const maxSentiment = Math.max(...sentimentEntries.map(([, v]) => v), 1);

  return (
    <div className="min-h-screen bg-paper font-sans">
      {/* Admin header bar */}
      <div className="bg-ink border-b border-ink">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between">
          <span className="text-white text-[13px] font-sans font-semibold tracking-wide">
            The AI Disruption Tracker — Admin
          </span>
          <a href="/" className="text-white/60 hover:text-white text-[11px] font-sans transition-colors">
            ← Back to site
          </a>
        </div>
      </div>
      <div className="h-[3px] bg-wsj-red" />

      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page header */}
        <div className="flex items-start justify-between border-b-2 border-ink pb-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink">Admin Dashboard</h1>
            <p className="text-[12px] text-ink-light font-sans mt-0.5">Monitor fetches, data quality, and system health</p>
          </div>
          <button
            onClick={triggerRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-ink hover:bg-ink-secondary text-white text-[12px] font-sans font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh Now'}
          </button>
        </div>

        {refreshMsg && (
          <div className={`text-[12px] font-sans px-4 py-2.5 border ${
            refreshMsg.startsWith('Error')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            {refreshMsg}
          </div>
        )}

        {error && (
          <div className="text-[12px] font-sans px-4 py-2.5 border bg-red-50 border-red-200 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-rule animate-pulse border border-rule" />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Overview cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="border border-rule p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-3.5 h-3.5 text-ink-light" />
                  <span className="text-[10px] text-ink-light font-sans uppercase tracking-widest">Social Posts</span>
                </div>
                <p className="text-2xl font-serif font-bold text-ink">{stats.totalPosts.toLocaleString()}</p>
              </div>
              <div className="border border-rule p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-3.5 h-3.5 text-ink-light" />
                  <span className="text-[10px] text-ink-light font-sans uppercase tracking-widest">News Articles</span>
                </div>
                <p className="text-2xl font-serif font-bold text-ink">{stats.totalNews.toLocaleString()}</p>
              </div>
              <div className="border border-rule p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3.5 h-3.5 text-ink-light" />
                  <span className="text-[10px] text-ink-light font-sans uppercase tracking-widest">Last Refresh</span>
                </div>
                <p className="text-[14px] font-sans font-semibold text-ink">
                  {stats.lastFetch
                    ? formatDistanceToNow(new Date(stats.lastFetch), { addSuffix: true })
                    : 'Never'}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              {/* Category breakdown */}
              <div>
                <SectionHeader>Category Breakdown</SectionHeader>
                <div className="space-y-3">
                  {categoryEntries.sort(([, a], [, b]) => b - a).map(([cat, count]) => (
                    <BarRow
                      key={cat}
                      label={cat}
                      value={count}
                      max={maxCategory}
                      color={CATEGORY_COLORS[cat] ?? 'bg-ink-faint'}
                    />
                  ))}
                </div>
              </div>

              {/* Sentiment + Sources */}
              <div>
                <SectionHeader>Sentiment Breakdown</SectionHeader>
                <div className="space-y-3 mb-6">
                  {sentimentEntries.map(([sentiment, count]) => (
                    <BarRow
                      key={sentiment}
                      label={sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                      value={count}
                      max={maxSentiment}
                      color={SENTIMENT_COLORS[sentiment] ?? 'bg-ink-faint'}
                    />
                  ))}
                </div>

                <SectionHeader>Top Sources</SectionHeader>
                <div className="divide-y divide-rule">
                  {stats.topSources.slice(0, 5).map(({ source, count }) => (
                    <div key={source} className="flex justify-between py-1.5 text-[12px] font-sans">
                      <span className="text-ink-secondary truncate">{source}</span>
                      <span className="text-ink-light font-mono ml-2 tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fetch logs */}
            <div>
              <SectionHeader>Recent Fetch Logs</SectionHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] font-sans">
                  <thead>
                    <tr className="text-left text-ink-light border-b border-rule">
                      <th className="pb-2 pr-4 font-semibold">Status</th>
                      <th className="pb-2 pr-4 font-semibold">Type</th>
                      <th className="pb-2 pr-4 font-semibold">Count</th>
                      <th className="pb-2 pr-4 font-semibold">Time</th>
                      <th className="pb-2 font-semibold">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {stats.fetchLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="text-ink-secondary">
                        <td className="py-2 pr-4">
                          <StatusIcon status={log.status} />
                        </td>
                        <td className="py-2 pr-4 capitalize">{log.type}</td>
                        <td className="py-2 pr-4 font-mono tabular-nums">{log.count}</td>
                        <td className="py-2 pr-4 whitespace-nowrap text-ink-light">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </td>
                        <td className="py-2 text-red-600 max-w-[200px] truncate">
                          {log.error ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
