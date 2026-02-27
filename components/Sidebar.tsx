'use client';

import { DollarSign, Users } from 'lucide-react';
import type { SidebarStats } from '@/types';
import KeywordHeatmap from './KeywordHeatmap';

interface Props {
  stats: SidebarStats | null;
  loading?: boolean;
}

function SentimentIndicator({ sentiment }: { sentiment: string }) {
  if (sentiment === 'positive') return <span className="text-emerald-700 text-[9px] font-bold">▲</span>;
  if (sentiment === 'negative') return <span className="text-red-700 text-[9px] font-bold">▼</span>;
  return <span className="text-ink-faint text-[9px] font-bold">◆</span>;
}

function SkeletonLine({ w = 'w-full' }: { w?: string }) {
  return <div className={`h-3.5 ${w} bg-rule animate-pulse`} />;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b-2 border-ink mb-3">
      <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-ink pb-1">
        {children}
      </h3>
    </div>
  );
}

export default function Sidebar({ stats, loading }: Props) {
  return (
    <aside className="space-y-6">
      {/* Market Stats */}
      <div>
        <SectionHeader>Live Stats</SectionHeader>
        {loading || !stats ? (
          <div className="space-y-2">
            <SkeletonLine />
            <SkeletonLine w="w-3/4" />
            <SkeletonLine />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-baseline py-1 border-b border-rule">
              <span className="text-[12px] text-ink-secondary font-sans">Total items</span>
              <span className="text-[13px] text-ink font-sans font-bold tabular-nums">
                {stats.totalItems.toLocaleString()}
              </span>
            </div>
            {stats.totalLayoffs !== null && (
              <div className="flex items-center justify-between py-1 border-b border-rule">
                <span className="flex items-center gap-1.5 text-[12px] text-ink-secondary font-sans">
                  <Users className="w-3 h-3 text-red-700" /> Layoffs tracked
                </span>
                <span className="text-[13px] text-red-700 font-sans font-bold tabular-nums">
                  {stats.totalLayoffs.toLocaleString()}
                </span>
              </div>
            )}
            {stats.totalFunding !== null && (
              <div className="flex items-center justify-between py-1 border-b border-rule">
                <span className="flex items-center gap-1.5 text-[12px] text-ink-secondary font-sans">
                  <DollarSign className="w-3 h-3 text-emerald-700" /> Funding raised
                </span>
                <span className="text-[13px] text-emerald-700 font-sans font-bold tabular-nums">
                  {stats.totalFunding}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trending Companies */}
      <div>
        <SectionHeader>Trending Companies</SectionHeader>
        {loading || !stats ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <SkeletonLine key={i} w={i % 2 === 0 ? 'w-full' : 'w-4/5'} />
            ))}
          </div>
        ) : stats.trendingCompanies.length === 0 ? (
          <p className="text-[11px] text-ink-light font-sans">No data yet.</p>
        ) : (
          <ol className="space-y-0 divide-y divide-rule">
            {stats.trendingCompanies.map((company, i) => (
              <li key={company.name} className="flex items-center justify-between gap-2 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-ink-faint font-mono w-3 flex-shrink-0 text-right">
                    {i + 1}
                  </span>
                  <SentimentIndicator sentiment={company.sentiment} />
                  <span className="text-[12px] text-ink font-sans truncate">{company.name}</span>
                </div>
                <span className="text-[11px] text-ink-light font-sans font-semibold flex-shrink-0 tabular-nums">
                  {company.count}×
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Keyword Cloud */}
      <div>
        <SectionHeader>Trending Keywords</SectionHeader>
        <KeywordHeatmap />
      </div>
    </aside>
  );
}
