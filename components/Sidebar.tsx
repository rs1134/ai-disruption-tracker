'use client';

import { Users, TrendingUp, Hash } from 'lucide-react';
import type { SidebarStats } from '@/types';
import KeywordHeatmap from './KeywordHeatmap';
import AIFundingCard from './AIFundingCard';

interface Props {
  stats: SidebarStats | null;
  loading?: boolean;
}

function SentimentDot({ sentiment }: { sentiment: string }) {
  const color =
    sentiment === 'positive' ? 'bg-emerald-500' :
    sentiment === 'negative' ? 'bg-red-500' :
    'bg-slate-300';
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${color}`} />;
}

function SkeletonLine({ w = 'w-full' }: { w?: string }) {
  return <div className={`h-4 ${w} bg-slate-200 rounded-lg animate-pulse`} />;
}

function SectionHeader({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
        {icon}
      </div>
      <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-600">
        {children}
      </h3>
    </div>
  );
}

export default function Sidebar({ stats, loading }: Props) {
  return (
    <aside className="space-y-5">
      {/* Live Stats card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
        <SectionHeader icon={<TrendingUp className="w-3 h-3" />}>
          Live Stats
        </SectionHeader>

        {loading || !stats ? (
          <div className="space-y-2.5">
            <SkeletonLine />
            <SkeletonLine w="w-3/4" />
            <SkeletonLine />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-[13px] text-slate-500">Total items</span>
              <span className="text-[14px] font-bold text-slate-900 tabular-nums">
                {stats.totalItems.toLocaleString()}
              </span>
            </div>
            {stats.totalLayoffs !== null && (
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="flex items-center gap-1.5 text-[13px] text-slate-500">
                  <Users className="w-3.5 h-3.5 text-red-500" /> Layoffs
                </span>
                <span className="text-[14px] font-bold text-red-500 tabular-nums">
                  {stats.totalLayoffs.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trending Companies card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
        <SectionHeader icon={<TrendingUp className="w-3 h-3" />}>
          Trending Companies
        </SectionHeader>

        {loading || !stats ? (
          <div className="space-y-2.5">
            {[...Array(6)].map((_, i) => (
              <SkeletonLine key={i} w={i % 2 === 0 ? 'w-full' : 'w-4/5'} />
            ))}
          </div>
        ) : stats.trendingCompanies.length === 0 ? (
          <p className="text-[12px] text-slate-400">No data yet.</p>
        ) : (
          <ol className="space-y-0">
            {stats.trendingCompanies.map((company, i) => (
              <li
                key={company.name}
                className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
              >
                <span className="text-[11px] text-slate-300 font-mono w-4 flex-shrink-0 text-right">
                  {i + 1}
                </span>
                <SentimentDot sentiment={company.sentiment} />
                <span className="text-[13px] text-slate-700 font-medium truncate flex-1">
                  {company.name}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold flex-shrink-0 tabular-nums">
                  {company.count}×
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Top AI Funding card (static curated data) */}
      <AIFundingCard />

      {/* Keyword Cloud card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
        <SectionHeader icon={<Hash className="w-3 h-3" />}>
          Trending Keywords
        </SectionHeader>
        <KeywordHeatmap />
      </div>
    </aside>
  );
}
