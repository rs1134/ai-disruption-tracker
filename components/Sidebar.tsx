'use client';

import { TrendingUp, DollarSign, Users, BarChart3, Activity } from 'lucide-react';
import type { SidebarStats } from '@/types';
import KeywordHeatmap from './KeywordHeatmap';

interface Props {
  stats: SidebarStats | null;
  loading?: boolean;
}

function SentimentDot({ sentiment }: { sentiment: string }) {
  const color =
    sentiment === 'positive' ? 'bg-emerald-400' :
    sentiment === 'negative' ? 'bg-red-400' :
    'bg-slate-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

function SkeletonLine({ w = 'w-full' }: { w?: string }) {
  return <div className={`h-4 ${w} bg-slate-800/60 rounded animate-pulse`} />;
}

export default function Sidebar({ stats, loading }: Props) {
  return (
    <aside className="space-y-5">
      {/* Stats overview */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> Live Stats
        </h3>
        {loading || !stats ? (
          <div className="space-y-2">
            <SkeletonLine />
            <SkeletonLine w="w-3/4" />
            <SkeletonLine />
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Total items</span>
              <span className="text-white font-mono">{stats.totalItems.toLocaleString()}</span>
            </div>
            {stats.totalLayoffs !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-red-400" /> Layoffs tracked
                </span>
                <span className="text-red-400 font-mono font-semibold">
                  {stats.totalLayoffs.toLocaleString()}
                </span>
              </div>
            )}
            {stats.totalFunding !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Funding raised
                </span>
                <span className="text-emerald-400 font-mono font-semibold">
                  {stats.totalFunding}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trending Companies */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" /> Trending Companies
        </h3>
        {loading || !stats ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <SkeletonLine key={i} w={i % 2 === 0 ? 'w-full' : 'w-4/5'} />)}
          </div>
        ) : stats.trendingCompanies.length === 0 ? (
          <p className="text-xs text-slate-500">No data yet.</p>
        ) : (
          <ol className="space-y-2">
            {stats.trendingCompanies.map((company, i) => (
              <li key={company.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-slate-600 font-mono w-4 flex-shrink-0">
                    {i + 1}
                  </span>
                  <SentimentDot sentiment={company.sentiment} />
                  <span className="text-sm text-slate-300 truncate">{company.name}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono flex-shrink-0">
                  {company.count}x
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Keyword Heatmap */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" /> Keyword Heatmap
        </h3>
        <KeywordHeatmap />
      </div>
    </aside>
  );
}
