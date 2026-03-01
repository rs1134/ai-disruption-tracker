'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useState } from 'react';

// ── Benchmark data ────────────────────────────────────────────────────────────
// Metrics sourced from published benchmarks (MMLU, HumanEval, MATH, GPQA Diamond)
// Speed is normalized relative score (100 = fastest tested)
// Scores represent approximate public benchmark results as of Q1 2026

const US_COLOR = '#6366f1';   // indigo
const CN_COLOR = '#f43f5e';   // rose

interface ModelScore {
  model: string;
  shortName: string;
  country: 'US' | 'CN';
  color: string;
  mmlu: number;       // General knowledge %
  coding: number;     // HumanEval pass@1 %
  math: number;       // MATH benchmark %
  reasoning: number;  // GPQA Diamond %
  speed: number;      // Normalized 0-100
  overall: number;    // Avg of all 5 metrics
}

const MODELS: ModelScore[] = [
  // ── US ────────────────────────────────────────────────────
  {
    model: 'GPT-4o',
    shortName: 'GPT-4o',
    country: 'US',
    color: '#10a37f',   // OpenAI green
    mmlu: 88.7, coding: 90.2, math: 76.6, reasoning: 53.6, speed: 80,
    overall: 77.8,
  },
  {
    model: 'Claude 3.7 Sonnet',
    shortName: 'Claude 3.7',
    country: 'US',
    color: '#d97706',   // amber
    mmlu: 90.1, coding: 92.0, math: 81.5, reasoning: 68.0, speed: 75,
    overall: 81.3,
  },
  {
    model: 'Gemini 2.0 Flash',
    shortName: 'Gemini 2.0',
    country: 'US',
    color: '#4285f4',   // Google blue
    mmlu: 87.0, coding: 87.9, math: 79.1, reasoning: 62.1, speed: 92,
    overall: 81.6,
  },
  // ── China ─────────────────────────────────────────────────
  {
    model: 'DeepSeek V3',
    shortName: 'DeepSeek V3',
    country: 'CN',
    color: '#8b5cf6',   // violet
    mmlu: 88.5, coding: 89.1, math: 90.2, reasoning: 59.1, speed: 85,
    overall: 82.4,
  },
  {
    model: 'Qwen 2.5 Max',
    shortName: 'Qwen 2.5',
    country: 'CN',
    color: '#ef4444',   // red
    mmlu: 87.3, coding: 87.9, math: 85.7, reasoning: 55.2, speed: 78,
    overall: 78.8,
  },
  {
    model: 'Kimi k1.5',
    shortName: 'Kimi k1.5',
    country: 'CN',
    color: '#06b6d4',   // cyan
    mmlu: 86.5, coding: 85.6, math: 77.5, reasoning: 45.0, speed: 70,
    overall: 72.9,
  },
];

// Radar data: one row per metric, model scores as keys
const RADAR_METRICS = [
  { metric: 'Knowledge\n(MMLU)', key: 'mmlu' as const },
  { metric: 'Coding\n(HumanEval)', key: 'coding' as const },
  { metric: 'Math\n(MATH)', key: 'math' as const },
  { metric: 'Reasoning\n(GPQA)', key: 'reasoning' as const },
  { metric: 'Speed', key: 'speed' as const },
];

const radarData = RADAR_METRICS.map(({ metric, key }) => {
  const row: Record<string, string | number> = { metric };
  MODELS.forEach((m) => { row[m.shortName] = m[key]; });
  return row;
});

// Bar chart data: one row per model
const barData = MODELS.map((m) => ({
  name: m.shortName,
  country: m.country,
  MMLU: m.mmlu,
  Coding: m.coding,
  Math: m.math,
  Reasoning: m.reasoning,
  Speed: m.speed,
  color: m.color,
}));

// Country-average radar data for head-to-head
function countryAvg(country: 'US' | 'CN') {
  const group = MODELS.filter((m) => m.country === country);
  return RADAR_METRICS.map(({ metric, key }) => ({
    metric: metric.replace('\n', ' '),
    value: Math.round(group.reduce((s, m) => s + m[key], 0) / group.length),
  }));
}
const usAvg = countryAvg('US');
const cnAvg = countryAvg('CN');

const headToHeadData = usAvg.map((row, i) => ({
  metric: row.metric,
  'US Avg': row.value,
  'China Avg': cnAvg[i].value,
}));

// ── Custom tooltip ────────────────────────────────────────────────────────────
function MetricTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white rounded-lg px-3 py-2 text-[12px] shadow-xl">
      <p className="font-bold mb-1 text-slate-200">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AIComparisonChart() {
  const [tab, setTab] = useState<'radar' | 'bars' | 'headtohead'>('radar');

  return (
    <section className="mt-12 mb-8">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: US_COLOR }} />
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">US</span>
            <span className="text-slate-300 mx-1">vs</span>
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: CN_COLOR }} />
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">China</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">AI Chatbot Performance Comparison</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Top 3 US vs Top 3 Chinese AI models · MMLU · HumanEval · MATH · GPQA · Speed · Q1 2026
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5 self-start sm:self-auto">
          {([ ['radar', 'Spider Chart'], ['bars', 'Bar Chart'], ['headtohead', 'Head-to-Head'] ] as const).map(
            ([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                  tab === id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        {/* ── Spider / Radar chart ── */}
        {tab === 'radar' && (
          <>
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[40, 100]}
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  tickCount={4}
                />
                {MODELS.map((m) => (
                  <Radar
                    key={m.shortName}
                    name={m.shortName}
                    dataKey={m.shortName}
                    stroke={m.color}
                    fill={m.color}
                    fillOpacity={0.08}
                    strokeWidth={2}
                    dot={{ r: 3, fill: m.color }}
                  />
                ))}
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 16 }}
                  formatter={(value) => {
                    const model = MODELS.find((m) => m.shortName === value);
                    return (
                      <span style={{ color: '#475569' }}>
                        {model?.country === 'US' ? '🇺🇸' : '🇨🇳'} {value}
                      </span>
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-slate-400 mt-1">
              Outer ring = 100. Scores based on published benchmarks.
            </p>
          </>
        )}

        {/* ── Bar chart ── */}
        {tab === 'bars' && (
          <>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                data={barData}
                margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                />
                <YAxis
                  domain={[40, 100]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  width={32}
                />
                <Tooltip content={<MetricTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="MMLU" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Coding" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Math" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Reasoning" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Speed" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {/* Country labels */}
            <div className="flex justify-around text-[10px] text-slate-400 mt-1 px-8">
              <span>🇺🇸 US Models →</span>
              <span>← 🇨🇳 Chinese Models</span>
            </div>
          </>
        )}

        {/* ── Head-to-head average ── */}
        {tab === 'headtohead' && (
          <>
            <div className="flex justify-center gap-8 mb-4 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ background: US_COLOR }} />
                <span className="font-semibold text-slate-700">US Average (GPT-4o · Claude 3.7 · Gemini 2.0)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ background: CN_COLOR }} />
                <span className="font-semibold text-slate-700">China Average (DeepSeek · Qwen · Kimi)</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={headToHeadData}
                margin={{ top: 10, right: 30, bottom: 20, left: 0 }}
                barCategoryGap="30%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} width={32} />
                <Tooltip content={<MetricTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="US Avg" fill={US_COLOR} radius={[4, 4, 0, 0]} barSize={36} />
                <Bar dataKey="China Avg" fill={CN_COLOR} radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
            {/* Score table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 pr-3 font-semibold text-slate-500">Model</th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-500">MMLU</th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-500">Coding</th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-500">Math</th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-500">Reasoning</th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-500">Speed</th>
                    <th className="text-center py-2 pl-2 font-semibold text-slate-500">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {MODELS.map((m) => (
                    <tr key={m.model} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-2 pr-3 font-medium text-slate-700 flex items-center gap-1.5">
                        <span>{m.country === 'US' ? '🇺🇸' : '🇨🇳'}</span>
                        <span
                          className="w-1.5 h-4 rounded-sm flex-shrink-0"
                          style={{ background: m.color }}
                        />
                        {m.model}
                      </td>
                      <td className="text-center py-2 px-2 tabular-nums text-slate-600">{m.mmlu}</td>
                      <td className="text-center py-2 px-2 tabular-nums text-slate-600">{m.coding}</td>
                      <td className="text-center py-2 px-2 tabular-nums text-slate-600">{m.math}</td>
                      <td className="text-center py-2 px-2 tabular-nums text-slate-600">{m.reasoning}</td>
                      <td className="text-center py-2 px-2 tabular-nums text-slate-600">{m.speed}</td>
                      <td className="text-center py-2 pl-2 tabular-nums font-bold" style={{ color: m.color }}>
                        {m.overall}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <p className="mt-2 text-[10px] text-slate-400 text-right">
        Scores are approximate. MMLU / HumanEval / MATH / GPQA Diamond benchmarks · Speed is normalized.
      </p>
    </section>
  );
}
