'use client';

import Link from 'next/link';
import { Zap, ArrowLeft, ExternalLink } from 'lucide-react';
import AIComparisonChart from '@/components/AIComparisonChart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

// ── Static data ───────────────────────────────────────────────────────────────

const US_COLOR = '#6366f1';
const CN_COLOR = '#f43f5e';

// Per-category top-3 rankings from arena.ai (March 2026)
const CATEGORIES = [
  {
    id: 'text',
    label: 'Text / Chat',
    href: 'https://arena.ai/leaderboard/text',
    emoji: '💬',
    color: 'indigo',
    us: [
      { rank: 1, model: 'Claude Opus 4.6', company: 'Anthropic', elo: 1503 },
      { rank: 2, model: 'Claude Opus 4.6 (thinking)', company: 'Anthropic', elo: 1503 },
      { rank: 3, model: 'Gemini 3.1 Pro', company: 'Google', elo: 1500 },
    ],
    cn: [
      { rank: 10, model: 'Seed 2.0', company: 'ByteDance', elo: 1470 },
      { rank: 16, model: 'GLM-5', company: 'Zhipu AI', elo: 1456 },
      { rank: 17, model: 'Qwen 3.5', company: 'Alibaba', elo: 1451 },
    ],
    insight: 'US models dominate the top 9 spots. Seed 2.0 is the first Chinese model to break into the top 10.',
  },
  {
    id: 'code',
    label: 'Coding',
    href: 'https://arena.ai/leaderboard/code',
    emoji: '💻',
    color: 'emerald',
    us: [
      { rank: 1, model: 'Claude Opus 4.6', company: 'Anthropic', elo: 1560 },
      { rank: 2, model: 'Claude Opus 4.6 (thinking)', company: 'Anthropic', elo: 1553 },
      { rank: 3, model: 'Claude Sonnet 4.6', company: 'Anthropic', elo: 1531 },
    ],
    cn: [
      { rank: 8,  model: 'GLM-5', company: 'Zhipu AI', elo: 1451 },
      { rank: 12, model: 'Kimi K2.5', company: 'Moonshot AI', elo: 1436 },
      { rank: 17, model: 'Qwen 3.5', company: 'Alibaba', elo: 1396 },
    ],
    insight: 'Anthropic holds 6 of the top 10 code slots. GLM-5 is the only Chinese model in the top 10.',
  },
  {
    id: 'vision',
    label: 'Vision / Multimodal',
    href: 'https://arena.ai/leaderboard/vision',
    emoji: '👁️',
    color: 'amber',
    us: [
      { rank: 1, model: 'Gemini 3 Pro', company: 'Google', elo: 1288 },
      { rank: 2, model: 'Gemini 3.1 Pro', company: 'Google', elo: 1278 },
      { rank: 4, model: 'GPT-5.2', company: 'OpenAI', elo: 1271 },
    ],
    cn: [
      { rank: 6,  model: 'Seed 2.0', company: 'ByteDance', elo: 1260 },
      { rank: 8,  model: 'Kimi K2.5', company: 'Moonshot AI', elo: 1248 },
      { rank: 11, model: 'Qwen 3.5', company: 'Alibaba', elo: 1244 },
    ],
    insight: 'Chinese models are strongest in Vision — Seed 2.0 and Kimi K2.5 both crack the global top 10.',
  },
];

// Head-to-head stat cards
const HEAD_TO_HEAD = [
  { label: 'Overall #1 Model', us: 'Claude Opus 4.6', cn: 'Seed 2.0', usBetter: true },
  { label: 'Best in Code', us: 'Claude Opus 4.6 (1560)', cn: 'GLM-5 (1451)', usBetter: true },
  { label: 'Best in Vision', us: 'Gemini 3 Pro (1288)', cn: 'Seed 2.0 (1260)', usBetter: true },
  { label: 'Fastest Response', us: 'Gemini 3 Flash', cn: 'Seed 2.0', usBetter: false },
  { label: 'Top 10 Appearances', us: '9 models', cn: '1 model (text)', usBetter: true },
  { label: 'Vision Top 10', us: '4 models', cn: '3 models', usBetter: true },
];

// Funding data for bar chart
const FUNDING_DATA = [
  { name: 'OpenAI', amount: 150, country: 'US', color: '#10a37f' },
  { name: 'Anthropic', amount: 44.3, country: 'US', color: '#d97706' },
  { name: 'xAI', amount: 40, country: 'US', color: '#6366f1' },
  { name: 'DeepSeek', amount: 6, country: 'CN', color: '#8b5cf6' },
  { name: 'Zhipu AI', amount: 3.4, country: 'CN', color: '#ef4444' },
  { name: 'Moonshot AI', amount: 3.3, country: 'CN', color: '#06b6d4' },
  { name: 'Waymo', amount: 16, country: 'US', color: '#4285f4' },
  { name: 'ByteDance AI', amount: 10, country: 'CN', color: '#f97316' },
];

// Key milestones timeline
const MILESTONES = [
  { date: 'Nov 2022', event: 'ChatGPT launches, 100M users in 60 days', country: 'US' },
  { date: 'Mar 2023', event: 'GPT-4 released, multimodal capabilities', country: 'US' },
  { date: 'Jul 2023', event: 'Claude 2 released by Anthropic', country: 'US' },
  { date: 'Dec 2023', event: 'Gemini Ultra beats GPT-4 on MMLU', country: 'US' },
  { date: 'Jan 2024', event: 'Qwen 1.5 open-sourced by Alibaba', country: 'CN' },
  { date: 'May 2024', event: 'GPT-4o released — real-time audio/vision', country: 'US' },
  { date: 'Sep 2024', event: 'Claude 3.5 Sonnet tops coding benchmarks', country: 'US' },
  { date: 'Nov 2024', event: 'Kimi k1.5 achieves 77.5% on MATH', country: 'CN' },
  { date: 'Jan 2025', event: 'DeepSeek R1 shocks global AI community', country: 'CN' },
  { date: 'Mar 2025', event: 'OpenAI raises $40B from SoftBank', country: 'US' },
  { date: 'Jul 2025', event: 'GLM-5 reaches top-10 in Code Arena', country: 'CN' },
  { date: 'Jan 2026', event: 'Seed 2.0 (ByteDance) enters Text Arena top-10', country: 'CN' },
  { date: 'Feb 2026', event: 'OpenAI raises $110B — $730B valuation', country: 'US' },
  { date: 'Feb 2026', event: 'Anthropic raises $30B Series G — $380B valuation', country: 'US' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
  emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  amber: 'bg-amber-50 border-amber-100 text-amber-700',
};
const dotMap: Record<string, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
};

function FundingTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { country: string } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const { country } = payload[0].payload;
  return (
    <div className="bg-slate-900 text-white rounded-lg px-3 py-2 text-[12px] shadow-xl">
      <p className="font-bold">{label}</p>
      <p className="text-slate-300">{country === 'US' ? '🇺🇸' : '🇨🇳'} ${payload[0].value}B total raised</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ComparePage() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Nav bar */}
      <header className="bg-slate-900 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-[15px] tracking-tight">AI Disruption</span>
              <span className="text-indigo-400 font-bold text-[15px] tracking-tight ml-1">Tracker</span>
            </div>
          </Link>

          <div className="flex items-center gap-1 text-slate-400 text-[13px] ml-2">
            <span>/</span>
            <span className="text-white font-semibold ml-1">🇺🇸 US vs 🇨🇳 China</span>
          </div>

          <Link
            href="/"
            className="ml-auto flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Feed
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-5xl">🇺🇸</span>
            <span className="text-2xl font-black text-slate-500">VS</span>
            <span className="text-5xl">🇨🇳</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            US vs China AI Race
          </h1>
          <p className="text-slate-400 text-[15px] max-w-xl mx-auto">
            Side-by-side benchmark comparison of the world&rsquo;s top AI models across
            Text, Code, Vision, Reasoning and Speed — powered by live data from{' '}
            <a href="https://arena.ai/leaderboard" target="_blank" rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline">arena.ai</a>.
          </p>
          <p className="text-slate-500 text-[12px] mt-2">Updated March 2026</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">

        {/* ── Head-to-head stat grid ── */}
        <section>
          <h2 className="text-lg font-black text-slate-900 mb-4">Quick Comparison</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {HEAD_TO_HEAD.map((h) => (
              <div key={h.label} className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{h.label}</p>
                <div className="space-y-1.5">
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-[12px] font-semibold ${h.usBetter ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600'}`}>
                    🇺🇸 <span>{h.us}</span>
                    {h.usBetter && <span className="ml-auto text-[10px] font-bold text-indigo-500">LEAD</span>}
                  </div>
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-[12px] font-semibold ${!h.usBetter ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'}`}>
                    🇨🇳 <span>{h.cn}</span>
                    {!h.usBetter && <span className="ml-auto text-[10px] font-bold text-rose-500">LEAD</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Interactive comparison chart ── */}
        <section>
          <h2 className="text-lg font-black text-slate-900 mb-1">Performance Charts</h2>
          <p className="text-[12px] text-slate-500 mb-4">Spider, bar, and head-to-head views — tap tabs to switch</p>
          <AIComparisonChart />
        </section>

        {/* ── Per-category leaderboards ── */}
        <section>
          <h2 className="text-lg font-black text-slate-900 mb-1">Category Leaderboards</h2>
          <p className="text-[12px] text-slate-500 mb-6">Top 3 US and Top 3 Chinese models per arena — live from arena.ai</p>
          <div className="grid md:grid-cols-3 gap-5">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                {/* Card header */}
                <div className={`px-4 py-3 border-b ${colorMap[cat.color]} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="font-bold text-[14px]">{cat.label}</span>
                  </div>
                  <a href={cat.href} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
                    arena.ai <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-4 space-y-4">
                  {/* US models */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">🇺🇸 US Top 3</p>
                    <ol className="space-y-1.5">
                      {cat.us.map((m) => (
                        <li key={m.model} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-300 font-mono w-5 text-right">#{m.rank}</span>
                            <div>
                              <div className="text-[12px] font-semibold text-slate-800">{m.model}</div>
                              <div className="text-[10px] text-slate-400">{m.company}</div>
                            </div>
                          </div>
                          <span className="text-[12px] font-bold tabular-nums" style={{ color: US_COLOR }}>{m.elo}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="border-t border-dashed border-slate-100" />

                  {/* China models */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">🇨🇳 China Top 3</p>
                    <ol className="space-y-1.5">
                      {cat.cn.map((m) => (
                        <li key={m.model} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-300 font-mono w-5 text-right">#{m.rank}</span>
                            <div>
                              <div className="text-[12px] font-semibold text-slate-800">{m.model}</div>
                              <div className="text-[10px] text-slate-400">{m.company}</div>
                            </div>
                          </div>
                          <span className="text-[12px] font-bold tabular-nums" style={{ color: CN_COLOR }}>{m.elo}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Insight pill */}
                  <div className={`rounded-lg px-3 py-2 border text-[11px] text-slate-600 leading-snug ${colorMap[cat.color]}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${dotMap[cat.color]}`} />
                    {cat.insight}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Funding comparison bar chart ── */}
        <section>
          <h2 className="text-lg font-black text-slate-900 mb-1">Funding Raised (USD Billions)</h2>
          <p className="text-[12px] text-slate-500 mb-5">Top AI labs by total capital raised — Q1 2026</p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <div className="flex gap-4 mb-4 text-[12px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ background: US_COLOR }} />
                <span className="font-semibold text-slate-600">🇺🇸 US company</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ background: CN_COLOR }} />
                <span className="font-semibold text-slate-600">🇨🇳 Chinese company</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={FUNDING_DATA.sort((a, b) => b.amount - a.amount)}
                margin={{ top: 5, right: 20, bottom: 20, left: 0 }}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="B" width={40} />
                <Tooltip content={<FundingTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {FUNDING_DATA.sort((a, b) => b.amount - a.amount).map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.country === 'US' ? US_COLOR : CN_COLOR}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-slate-400 text-right mt-2">
              Sources: public press releases · Crunchbase · Q1 2026
            </p>
          </div>
        </section>

        {/* ── Timeline ── */}
        <section>
          <h2 className="text-lg font-black text-slate-900 mb-1">Key Milestones</h2>
          <p className="text-[12px] text-slate-500 mb-6">Major moments in the US vs China AI race</p>
          <div className="relative">
            {/* Center line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-px" />

            <div className="space-y-3">
              {MILESTONES.map((m, i) => {
                const isUS = m.country === 'US';
                return (
                  <div
                    key={i}
                    className={`relative flex gap-4 md:gap-0 items-start ${isUS ? 'md:flex-row-reverse' : 'md:flex-row'}`}
                  >
                    {/* Content */}
                    <div className={`flex-1 md:max-w-[calc(50%-24px)] ${isUS ? 'md:pl-6 md:pr-0' : 'md:pr-6 md:pl-0 md:text-right'}`}>
                      <div className={`bg-white rounded-xl border shadow-card p-3 inline-block w-full ${isUS ? 'border-indigo-100' : 'border-rose-100'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isUS ? 'text-indigo-500' : 'text-rose-500'}`}>
                          {isUS ? '🇺🇸 US' : '🇨🇳 China'} · {m.date}
                        </p>
                        <p className="text-[13px] font-semibold text-slate-800">{m.event}</p>
                      </div>
                    </div>

                    {/* Center dot (desktop) */}
                    <div className="hidden md:flex w-12 flex-shrink-0 items-center justify-center">
                      <div className={`w-3 h-3 rounded-full border-2 border-white shadow ${isUS ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                    </div>

                    {/* Spacer for opposite side */}
                    <div className="hidden md:block flex-1 md:max-w-[calc(50%-24px)]" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Source links ── */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h3 className="font-bold text-slate-800 mb-3">Data Sources</h3>
          <div className="flex flex-wrap gap-3">
            {[
              ['arena.ai/leaderboard/text', 'https://arena.ai/leaderboard/text', 'Text Arena'],
              ['arena.ai/leaderboard/code', 'https://arena.ai/leaderboard/code', 'Code Arena'],
              ['arena.ai/leaderboard/vision', 'https://arena.ai/leaderboard/vision', 'Vision Arena'],
            ].map(([, href, label]) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-[12px] font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {label}
              </a>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Arena Elo scores are based on crowd-sourced human preference votes. Reasoning and Speed scores are estimated from published benchmarks. Funding data from public press releases.
          </p>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-slate-900 mt-10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-white font-bold text-sm">AI Disruption Tracker</span>
            <p className="text-slate-400 text-[12px] mt-0.5">US vs China AI Comparison · Updated March 2026</p>
          </div>
          <Link href="/" className="text-[12px] text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to main feed
          </Link>
        </div>
      </footer>
    </div>
  );
}
