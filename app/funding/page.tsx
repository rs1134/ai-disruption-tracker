'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import {
  DollarSign, TrendingUp, Building2, Layers, ArrowUpDown,
  ArrowUp, ArrowDown, Search, SlidersHorizontal, RotateCcw,
  ExternalLink, ChevronLeft,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FundingRound {
  id: string;
  companyName: string;
  fundingAmountM: number | null;
  fundingDisplay: string;
  roundType: string;
  investors: string[];
  industry: string;
  location: string;
  announcedDate: string;
  sourceUrl: string | null;
  description: string;
  valuationDisplay: string | null;
}

interface Stats {
  totals: {
    total_rounds: string;
    total_companies: string;
    total_amount_m: string;
    avg_amount_m: string;
    largest_company: string;
    largest_display: string;
    latest_company: string;
    latest_display: string;
    latest_date: string;
  };
  byIndustry: { industry: string; total_m: string; count: string }[];
  byStage: { round_type: string; count: string; total_m: string }[];
  byMonth: { month: string; total_m: string; count: string }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INDUSTRY_COLORS: Record<string, string> = {
  'AI Platform':           '#6366f1',
  'AI Safety':             '#8b5cf6',
  'AI Foundation Models':  '#a855f7',
  'AI Infrastructure':     '#0ea5e9',
  'AI Dev Tools':          '#06b6d4',
  'AI Enterprise':         '#3b82f6',
  'AI Enterprise Search':  '#60a5fa',
  'AI Robotics':           '#f97316',
  'Autonomous Vehicles':   '#fb923c',
  'AI Healthcare':         '#22c55e',
  'AI Search':             '#10b981',
  'AI Video':              '#ec4899',
  'AI Audio':              '#f43f5e',
  'AI Legal':              '#eab308',
  'AI Customer Service':   '#f59e0b',
  'AI Data':               '#64748b',
  'AI Open Source':        '#84cc16',
  'AI Agents':             '#14b8a6',
  'AI Security':           '#ef4444',
  'AI Coding':             '#8b5cf6',
  'AI Consumer':           '#d946ef',
  'AI Research':           '#7c3aed',
};

const INDUSTRIES = [
  '', 'AI Platform', 'AI Safety', 'AI Foundation Models', 'AI Infrastructure',
  'AI Dev Tools', 'AI Enterprise', 'AI Robotics', 'Autonomous Vehicles',
  'AI Healthcare', 'AI Search', 'AI Video', 'AI Audio', 'AI Legal',
  'AI Customer Service', 'AI Data', 'AI Open Source', 'AI Agents',
  'AI Security', 'AI Coding', 'AI Consumer', 'AI Research',
];

const STAGES = [
  '', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D',
  'Series E', 'Series F', 'Series G', 'Strategic', 'IPO', 'Acquisition', 'Grant', 'Undisclosed',
];

const YEARS = ['', '2026', '2025', '2024', '2023', '2022'];

const SORT_COLS = ['date', 'amount', 'company'] as const;
type SortCol = typeof SORT_COLS[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(m: string | number | null | undefined): string {
  const n = Number(m ?? 0);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}T`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}B`;
  return `$${n.toFixed(0)}M`;
}

function fmtDate(d: string): string {
  if (!d) return '';
  try {
    // Parse as UTC to avoid timezone-induced day/year shifts
    const [yr, mo, dy] = d.split('-').map(Number);
    const dt = new Date(Date.UTC(yr, mo - 1, dy));
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  } catch { return d; }
}

function industryColor(ind: string): string {
  return INDUSTRY_COLORS[ind] ?? '#6366f1';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, accent,
}: {
  label: string; value: string; sub?: string; icon: React.ReactNode; accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-[22px] font-black text-slate-900 leading-tight tabular-nums">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function SortBtn({
  col, current, order, onClick,
}: {
  col: SortCol; current: SortCol; order: string; onClick: () => void;
}) {
  const active = col === current;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-[12px] font-semibold transition-colors ${
        active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-700'
      }`}
    >
      {col.charAt(0).toUpperCase() + col.slice(1)}
      {active
        ? order === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
        : <ArrowUpDown className="w-3 h-3 opacity-50" />}
    </button>
  );
}

// ── Custom Tooltip for recharts ───────────────────────────────────────────────

function CustomBarTooltip({ active, payload }: { active?: boolean; payload?: { payload: { industry: string; total_m: string; count: string } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-900 text-white rounded-lg px-3 py-2 shadow-xl text-[12px]">
      <p className="font-bold mb-1">{d.industry}</p>
      <p>Total: {fmt(d.total_m)}</p>
      <p>{d.count} rounds</p>
    </div>
  );
}

function CustomAreaTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white rounded-lg px-3 py-2 shadow-xl text-[12px]">
      <p className="font-bold mb-1">{label}</p>
      <p>Raised: {fmt(payload[0].value)}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FundingPage() {
  // Data
  const [rounds, setRounds]   = useState<FundingRound[]>([]);
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search,   setSearch]   = useState('');
  const [industry, setIndustry] = useState('');
  const [stage,    setStage]    = useState('');
  const [location, setLocation] = useState('');
  const [year,     setYear]     = useState('');

  // Sort
  const [sortCol,   setSortCol]  = useState<SortCol>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI
  const [showFilters, setShowFilters] = useState(false);
  const [activeChart, setActiveChart] = useState<'industry' | 'trend'>('industry');

  // Fetch data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [roundsRes, statsRes] = await Promise.all([
        fetch('/api/funding'),
        fetch('/api/funding/stats'),
      ]);
      if (roundsRes.ok) {
        const j = await roundsRes.json();
        setRounds(j.rounds ?? []);
      }
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/funding/refresh', { method: 'POST' });
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  // Client-side filter + sort
  const filtered = useMemo(() => {
    let rows = [...rounds];
    if (search)   rows = rows.filter(r => r.companyName.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()));
    if (industry) rows = rows.filter(r => r.industry === industry);
    if (stage)    rows = rows.filter(r => r.roundType === stage);
    if (location) rows = rows.filter(r => r.location.toLowerCase().includes(location.toLowerCase()));
    if (year)     rows = rows.filter(r => r.announcedDate.startsWith(year));

    rows.sort((a, b) => {
      const dir = sortOrder === 'desc' ? -1 : 1;
      if (sortCol === 'amount') {
        return dir * ((a.fundingAmountM ?? -1) - (b.fundingAmountM ?? -1));
      }
      if (sortCol === 'company') {
        return dir * a.companyName.localeCompare(b.companyName);
      }
      // date
      return dir * a.announcedDate.localeCompare(b.announcedDate);
    });
    return rows;
  }, [rounds, search, industry, stage, location, year, sortCol, sortOrder]);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortOrder(o => o === 'desc' ? 'asc' : 'desc');
    } else {
      setSortCol(col);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setSearch(''); setIndustry(''); setStage(''); setLocation(''); setYear('');
  };

  // Chart data
  const industryChartData = useMemo(() => {
    if (!stats) return [];
    return stats.byIndustry.slice(0, 8).map(d => ({
      industry: d.industry.replace('AI ', '').replace('Autonomous ', 'Auto '),
      total_m: Number(d.total_m),
      count: d.count,
    }));
  }, [stats]);

  const trendChartData = useMemo(() => {
    if (!stats) return [];
    return stats.byMonth.map(d => ({
      month: d.month,
      total_m: Number(d.total_m),
      count: Number(d.count),
    }));
  }, [stats]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const totalM = Number(stats?.totals.total_amount_m ?? 0);
  const totalRounds = Number(stats?.totals.total_rounds ?? 0);
  const totalCompanies = Number(stats?.totals.total_companies ?? 0);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[13px] font-semibold hidden sm:block">Back</span>
          </Link>

          <div className="w-px h-5 bg-white/10" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-[15px]">AI Funding Tracker</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-semibold tracking-wide">LIVE</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[12px] font-semibold transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Hero stats row ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Raised"
              value={fmt(totalM)}
              sub="across all tracked rounds"
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              accent="bg-emerald-50"
            />
            <StatCard
              label="Funding Rounds"
              value={totalRounds.toLocaleString()}
              sub={`${stats?.totals.largest_company ?? '—'} led at ${stats?.totals.largest_display ?? '—'}`}
              icon={<Layers className="w-5 h-5 text-indigo-600" />}
              accent="bg-indigo-50"
            />
            <StatCard
              label="Companies Funded"
              value={totalCompanies.toLocaleString()}
              sub="unique companies tracked"
              icon={<Building2 className="w-5 h-5 text-violet-600" />}
              accent="bg-violet-50"
            />
            <StatCard
              label="Latest Round"
              value={stats?.totals.latest_display ?? '—'}
              sub={`${stats?.totals.latest_company ?? '—'} · ${fmtDate(stats?.totals.latest_date ?? '')}`}
              icon={<TrendingUp className="w-5 h-5 text-rose-600" />}
              accent="bg-rose-50"
            />
          </div>
        )}

        {/* ── Charts section ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm mb-8 overflow-hidden">
          {/* Chart tabs */}
          <div className="flex items-center gap-1 px-4 pt-4 border-b border-slate-100 pb-0">
            <button
              onClick={() => setActiveChart('industry')}
              className={`px-4 py-2 text-[13px] font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
                activeChart === 'industry'
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              By Sector
            </button>
            <button
              onClick={() => setActiveChart('trend')}
              className={`px-4 py-2 text-[13px] font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
                activeChart === 'trend'
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              Monthly Trend
            </button>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="h-56 bg-slate-50 rounded-lg animate-pulse" />
            ) : activeChart === 'industry' ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={industryChartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="industry" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} width={56} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="total_m" radius={[4, 4, 0, 0]}>
                    {industryChartData.map((entry, i) => (
                      <rect key={i} fill={industryColor(entry.industry)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendChartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="fundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} width={56} />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total_m"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#fundGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Filter + search bar ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm mb-4 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search companies or description…"
                className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold border transition-colors ${
                showFilters
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {(industry || stage || location || year) && (
                <span className="ml-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {[industry, stage, location, year].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Reset */}
            {(search || industry || stage || location || year) && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100">
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="px-3 py-2 text-[12px] rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700"
              >
                <option value="">All Sectors</option>
                {INDUSTRIES.filter(Boolean).map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
              <select
                value={stage}
                onChange={e => setStage(e.target.value)}
                className="px-3 py-2 text-[12px] rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700"
              >
                <option value="">All Stages</option>
                {STAGES.filter(Boolean).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Location…"
                className="px-3 py-2 text-[12px] rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700"
              />
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="px-3 py-2 text-[12px] rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700"
              >
                <option value="">All Years</option>
                {YEARS.filter(Boolean).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── Results count ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] text-slate-500">
            {loading ? 'Loading…' : (
              <>
                <span className="font-bold text-slate-800">{filtered.length.toLocaleString()}</span>
                {' '}funding round{filtered.length !== 1 ? 's' : ''}
                {(search || industry || stage || location || year) && ' (filtered)'}
              </>
            )}
          </p>
          {/* Sort pills */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Sort by</span>
            {SORT_COLS.map(col => (
              <SortBtn key={col} col={col} current={sortCol} order={sortOrder} onClick={() => toggleSort(col)} />
            ))}
          </div>
        </div>

        {/* ── Table / card list ───────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 h-20 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <p className="text-slate-400 text-[15px]">No funding rounds match your filters.</p>
            <button onClick={resetFilters} className="mt-3 text-indigo-600 text-[13px] font-semibold hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wide">Company</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wide">Stage</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wide">Sector</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wide">Location</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wide">Investors</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-bold text-slate-900">{r.companyName}</p>
                          {r.valuationDisplay && (
                            <p className="text-[11px] text-slate-400">Val: {r.valuationDisplay}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-black text-emerald-600 text-[15px] tabular-nums">{r.fundingDisplay}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {r.roundType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-white"
                          style={{ backgroundColor: industryColor(r.industry) }}
                        >
                          {r.industry.replace('AI ', '')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[12px]">{r.location}</td>
                      <td className="px-4 py-3 text-slate-500 text-[12px] tabular-nums whitespace-nowrap">{fmtDate(r.announcedDate)}</td>
                      <td className="px-4 py-3 text-slate-400 text-[11px] max-w-[180px] truncate">
                        {r.investors.join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {r.sourceUrl && (
                          <a
                            href={r.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-600"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-slate-900">{r.companyName}</p>
                      <p className="text-[11px] text-slate-400">{fmtDate(r.announcedDate)}</p>
                    </div>
                    <span className="font-black text-emerald-600 text-[16px] tabular-nums">{r.fundingDisplay}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {r.roundType}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-semibold text-white"
                      style={{ backgroundColor: industryColor(r.industry) }}
                    >
                      {r.industry.replace('AI ', '')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] text-slate-500 bg-slate-100">
                      {r.location}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-[12px] text-slate-500 line-clamp-2">{r.description}</p>
                  )}
                  {r.investors.length > 0 && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      <span className="font-semibold">Investors:</span> {r.investors.join(', ')}
                    </p>
                  )}
                  {r.sourceUrl && (
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-[11px] text-indigo-500 hover:text-indigo-700 font-semibold"
                    >
                      Source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <p className="mt-8 text-center text-[11px] text-slate-400">
          Data sourced from Crunchbase, TechCrunch, VentureBeat &amp; public press releases · Q1 2026
        </p>
      </main>
    </div>
  );
}
