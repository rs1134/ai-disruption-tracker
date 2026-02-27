'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, BarChart2, Database, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AdminStats, Category, Sentiment } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  Layoffs: 'bg-red-500',
  Funding: 'bg-emerald-500',
  'Product Launch': 'bg-blue-500',
  Regulation: 'bg-amber-500',
  Breakthrough: 'bg-purple-500',
  Acquisition: 'bg-cyan-500',
  General: 'bg-slate-500',
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-emerald-500',
  negative: 'bg-red-500',
  neutral: 'bg-slate-500',
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
  if (status === 'error') return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 font-mono w-8 text-right">{value}</span>
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
        setRefreshMsg(`Refreshed: +${data.results?.tweets ?? 0} tweets, +${data.results?.news ?? 0} articles`);
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
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor fetches, data quality, and system health</p>
        </div>
        <button
          onClick={triggerRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh Now'}
        </button>
      </div>

      {refreshMsg && (
        <div className={`text-sm px-4 py-2.5 rounded-lg border ${refreshMsg.startsWith('Error') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          {refreshMsg}
        </div>
      )}

      {error && (
        <div className="text-sm px-4 py-2.5 rounded-lg border bg-red-500/10 border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-surface-card border border-surface-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Overview cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wide">X Posts</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalPosts.toLocaleString()}</p>
            </div>
            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wide">News Articles</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalNews.toLocaleString()}</p>
            </div>
            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wide">Last Refresh</span>
              </div>
              <p className="text-sm font-medium text-white">
                {stats.lastFetch
                  ? formatDistanceToNow(new Date(stats.lastFetch), { addSuffix: true })
                  : 'Never'}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Category breakdown */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Category Breakdown
              </h3>
              <div className="space-y-3">
                {categoryEntries.sort(([,a],[,b]) => b-a).map(([cat, count]) => (
                  <BarRow
                    key={cat}
                    label={cat}
                    value={count}
                    max={maxCategory}
                    color={CATEGORY_COLORS[cat] ?? 'bg-slate-500'}
                  />
                ))}
              </div>
            </div>

            {/* Sentiment breakdown */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Sentiment Breakdown
              </h3>
              <div className="space-y-3 mb-5">
                {sentimentEntries.map(([sentiment, count]) => (
                  <BarRow
                    key={sentiment}
                    label={sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                    value={count}
                    max={maxSentiment}
                    color={SENTIMENT_COLORS[sentiment] ?? 'bg-slate-500'}
                  />
                ))}
              </div>

              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Top Sources
              </h3>
              <div className="space-y-1.5">
                {stats.topSources.slice(0, 5).map(({ source, count }) => (
                  <div key={source} className="flex justify-between text-xs">
                    <span className="text-slate-400 truncate">{source}</span>
                    <span className="text-slate-500 font-mono ml-2">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fetch logs */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Recent Fetch Logs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-surface-border">
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Count</th>
                    <th className="pb-2 pr-4">Time</th>
                    <th className="pb-2">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {stats.fetchLogs.slice(0, 15).map((log) => (
                    <tr key={log.id} className="text-slate-400">
                      <td className="py-2 pr-4">
                        <StatusIcon status={log.status} />
                      </td>
                      <td className="py-2 pr-4 capitalize">{log.type}</td>
                      <td className="py-2 pr-4 font-mono">{log.count}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </td>
                      <td className="py-2 text-red-400 max-w-[200px] truncate">
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
  );
}
