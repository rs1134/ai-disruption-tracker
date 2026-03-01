'use client';

import { DollarSign, TrendingUp } from 'lucide-react';
import { TOP_AI_COMPANIES, formatTotalFunding } from '@/lib/aiCompanies';

const BAR_MAX = TOP_AI_COMPANIES[0].fundingUSD; // normalize against largest

function SectionHeader({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
        {icon}
      </div>
      <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-600">
        {children}
      </h3>
    </div>
  );
}

export default function AIFundingCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
      <SectionHeader icon={<TrendingUp className="w-3 h-3" />}>
        Top AI Funding
      </SectionHeader>

      {/* Total at a glance */}
      <div className="flex items-center justify-between mb-4 bg-emerald-50 rounded-lg px-3 py-2">
        <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
          Top 5 total raised
        </span>
        <span className="text-[15px] font-black text-emerald-600 tabular-nums">
          {formatTotalFunding()}
        </span>
      </div>

      <ol className="space-y-3">
        {TOP_AI_COMPANIES.map((company, i) => {
          const pct = Math.round((company.fundingUSD / BAR_MAX) * 100);
          return (
            <li key={company.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-300 font-mono w-3">{i + 1}</span>
                  <span className="text-[13px] font-semibold text-slate-800">{company.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-500" />
                  <span className="text-[12px] font-bold text-emerald-600 tabular-nums">
                    {company.totalFunding}
                  </span>
                </div>
              </div>

              {/* Funding bar */}
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-0.5 text-[10px] text-slate-400">
                {company.latestRound} · {company.latestRoundDate}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-[9px] text-slate-300 text-right">
        Sources: Crunchbase / public filings · Q1 2026
      </p>
    </div>
  );
}
