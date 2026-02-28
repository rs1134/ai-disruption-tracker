'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, BarChart2, Database, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AdminStats, Category, Sentiment } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  Layoffs:         'bg-red-500',
  Funding:         'bg-emerald-500',
  'Product Launch':'bg-blue-500',
  Regulation:      'bg-amber-500',
  Breakthrough:    'bg-purple-500',
  Acquisition:     'bg-cyan-500',
  General:         'bg-slate-400',
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-emerald-500',
  negative: 'bg-red-500',
  neutral:  'bg-slate-300',
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  if (status === 'error')   return <XCircle className="w-4 h-4 text-red-500" />;
  return <AlertCircle className="w-4 h-4 text-amber-500" />;
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-slate-500 w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12px] text-slate-400 font-mono w-8 text-right tabular-nums">{value}</span>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 border ${color}`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-[12px] text-slate-500 mt-0.5">{label}</p>
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
        setRefreshMsg(`✓ Refreshed: +${data.results?.tweets ?? 0} social posts, +${data.results?.news ?? 0} articles`);
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
    <div className="min-h-screen bg-slate-50">
      {/* Dark header */}
      <div className="bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="text-white font-bold text-[14px]">AI Disruption Tracker</span>
            <span className="text-slate-500 font-medium text-[13px]">/ Admin</span>
          </div>
          <a href="/" className="text-slate-400 hover:text-white text-[12px] font-medium transition-colors">
            ← Back to site
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Monitor fetches, data quality, and system health</p>
          </div>
          <button
            onClick={triggerRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-card"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh Now'}
          </button>
        </div>

        {refreshMsg && (
          <div className={`text-[13px] px-4 py-3 rounded-xl border ${
            refreshMsg.startsWith('Error')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            {refreshMsg}
          </div>
        )}

        {error && (
          <div className="text-[13px] px-4 py-3 rounded-xl border bg-red-50 border-red-200 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white border border-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Overview cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard
                icon={<><Database className="w-4 h-4 text-indigo-500" /><span className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold ml-1">Social Posts</span></>}
                label="from Reddit & HN"
                value={stats.totalPosts.toLocaleString()}
                color="bg-white border-slate-100"
              />
              <StatCard
                icon={<><BarChart2 className="w-4 h-4 text-purple-500" /><span className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold ml-1">News Articles</span></>}
                label="from RSS feeds"
                value={stats.totalNews.toLocaleString()}
                color="bg-white border-slate-100"
              />
              <StatCard
                icon={<><Clock className="w-4 h-4 text-amber-500" /><span className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold ml-1">Last Refresh</span></>}
                label="via cron job"
                value={stats.lastFetch ? formatDistanceToNow(new Date(stats.lastFetch), { addSuffix: true }) : 'Never'}
                color="bg-white border-slate-100"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Category breakdown */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Category Breakdown
                </h3>
                <div className="space-y-3">
                  {categoryEntries.sort(([, a], [, b]) => b - a).map(([cat, count]) => (
                    <BarRow key={cat} label={cat} value={count} max={maxCategory} color={CATEGORY_COLORS[cat] ?? 'bg-slate-400'} />
                  ))}
                </div>
              </div>

              {/* Sentiment + top sources */}
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-4">
                    Sentiment Breakdown
                  </h3>
                  <div className="space-y-3">
                    {sentimentEntries.map(([sentiment, count]) => (
                      <BarRow
                        key={sentiment}
                        label={sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                        value={count}
                        max={maxSentiment}
                        color={SENTIMENT_COLORS[sentiment] ?? 'bg-slate-300'}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Top Sources
                  </h3>
                  <div className="space-y-0 divide-y divide-slate-100">
                    {stats.topSources.slice(0, 5).map(({ source, count }) => (
                      <div key={source} className="flex justify-between items-center py-2">
                        <span className="text-[13px] text-slate-600 font-medium truncate">{source}</span>
                        <span className="text-[12px] text-slate-400 font-mono ml-3 tabular-nums">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Fetch logs */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-4">
                Recent Fetch Logs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="pb-2 pr-4 font-semibold">Status</th>
                      <th className="pb-2 pr-4 font-semibold">Type</th>
                      <th className="pb-2 pr-4 font-semibold">Count</th>
                      <th className="pb-2 pr-4 font-semibold">Time</th>
                      <th className="pb-2 font-semibold">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.fetchLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="text-slate-600">
                        <td className="py-2.5 pr-4"><StatusIcon status={log.status} /></td>
                        <td className="py-2.5 pr-4 capitalize font-medium">{log.type}</td>
                        <td className="py-2.5 pr-4 font-mono tabular-nums">{log.count}</td>
                        <td className="py-2.5 pr-4 whitespace-nowrap text-slate-400">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </td>
                        <td className="py-2.5 text-red-500 max-w-[200px] truncate">
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
