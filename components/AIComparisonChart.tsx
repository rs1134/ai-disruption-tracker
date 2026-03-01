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

// ── Live Arena Elo data from arena.ai (March 2026) ───────────────────────────
//
// Text Arena  – overall instruction / chat ranking
// Code Arena  – software engineering & coding tasks
// Vision Arena – multimodal / image understanding
// Reasoning   – estimated from hard benchmark evals (GPQA Diamond, AIME)
// Speed       – relative normalized inference speed (100 = fastest)
//
// Where a model was not ranked in a category's top 25 the score is an estimate
// flagged with ~ in the table.  Radar values are normalized per-metric to a
// 55-100 scale so shape is comparable across the differently-scaled arenas.

const US_COLOR = '#6366f1';
const CN_COLOR = '#f43f5e';

interface ModelScore {
  model: string;
  shortName: string;
  company: string;
  country: 'US' | 'CN';
  color: string;
  // Raw Arena Elo per category (null = not ranked, shown as ~est in table)
  textElo: number;
  codeElo: number;
  visionElo: number;
  reasoningEst: number; // 0-100 estimate
  speedEst: number;     // 0-100 estimate
  // Radar-normalized values (55-100 per metric)
  text: number;
  code: number;
  vision: number;
  reasoning: number;
  speed: number;
  // Avg of 5 normalized metrics
  overall: number;
}

// Per-metric normalization to 55-100
// Text:   base=1447, max=1503, range=56
function normText(elo: number) { return Math.round(((elo - 1447) / 56) * 45 + 55); }
// Code:   base=1420, max=1560, range=140
function normCode(elo: number) { return Math.round(((elo - 1420) / 140) * 45 + 55); }
// Vision: base=1225, max=1278, range=53
function normVision(elo: number) { return Math.round(((elo - 1225) / 53) * 45 + 55); }

const MODELS: ModelScore[] = [
  // ── US ────────────────────────────────────────────────────────────────────
  {
    model: 'Claude Opus 4.6',
    shortName: 'Claude Opus 4.6',
    company: 'Anthropic',
    country: 'US', color: '#d97706',
    textElo: 1503, codeElo: 1560, visionElo: 1235,
    reasoningEst: 82, speedEst: 72,
    text: normText(1503),    // 100
    code: normCode(1560),    // 100
    vision: normVision(1235), // 76 (est)
    reasoning: 82, speed: 72,
    overall: 0,
  },
  {
    model: 'Gemini 3.1 Pro',
    shortName: 'Gemini 3.1 Pro',
    company: 'Google',
    country: 'US', color: '#4285f4',
    textElo: 1500, codeElo: 1461, visionElo: 1278,
    reasoningEst: 75, speedEst: 88,
    text: normText(1500),    // 98
    code: normCode(1461),    // 68
    vision: normVision(1278), // 100
    reasoning: 75, speed: 88,
    overall: 0,
  },
  {
    model: 'GPT-5.2',
    shortName: 'GPT-5.2',
    company: 'OpenAI',
    country: 'US', color: '#10a37f',
    textElo: 1481, codeElo: 1471, visionElo: 1271,
    reasoningEst: 73, speedEst: 82,
    text: normText(1481),    // 80
    code: normCode(1471),    // 71
    vision: normVision(1271), // 94
    reasoning: 73, speed: 82,
    overall: 0,
  },
  // ── China ─────────────────────────────────────────────────────────────────
  {
    model: 'Seed 2.0',
    shortName: 'Seed 2.0',
    company: 'ByteDance',
    country: 'CN', color: '#8b5cf6',
    textElo: 1470, codeElo: 1420, visionElo: 1260,
    reasoningEst: 63, speedEst: 90,
    text: normText(1470),    // 73
    code: normCode(1420),    // 55 (est – not in top 25 code)
    vision: normVision(1260), // 85
    reasoning: 63, speed: 90,
    overall: 0,
  },
  {
    model: 'GLM-5',
    shortName: 'GLM-5',
    company: 'Zhipu AI',
    country: 'CN', color: '#ef4444',
    textElo: 1456, codeElo: 1451, visionElo: 1225,
    reasoningEst: 60, speedEst: 85,
    text: normText(1456),    // 59
    code: normCode(1451),    // 65
    vision: normVision(1225), // 55 (est)
    reasoning: 60, speed: 85,
    overall: 0,
  },
  {
    model: 'Kimi K2.5',
    shortName: 'Kimi K2.5',
    company: 'Moonshot AI',
    country: 'CN', color: '#06b6d4',
    textElo: 1447, codeElo: 1436, visionElo: 1248,
    reasoningEst: 58, speedEst: 78,
    text: normText(1447),    // 55
    code: normCode(1436),    // 60
    vision: normVision(1248), // 79
    reasoning: 58, speed: 78,
    overall: 0,
  },
];

// Compute overall avg of 5 normalized metrics
MODELS.forEach((m) => {
  m.overall = Math.round((m.text + m.code + m.vision + m.reasoning + m.speed) / 5);
});

// ── Chart data ───────────────────────────────────────────────────────────────
const RADAR_METRICS = [
  { metric: 'Text', key: 'text' as const },
  { metric: 'Code', key: 'code' as const },
  { metric: 'Vision', key: 'vision' as const },
  { metric: 'Reasoning', key: 'reasoning' as const },
  { metric: 'Speed', key: 'speed' as const },
];

const radarData = RADAR_METRICS.map(({ metric, key }) => {
  const row: Record<string, string | number> = { metric };
  MODELS.forEach((m) => { row[m.shortName] = m[key]; });
  return row;
});

const barData = MODELS.map((m) => ({
  name: m.shortName,
  Text: m.text,
  Code: m.code,
  Vision: m.vision,
  Reasoning: m.reasoning,
  Speed: m.speed,
  color: m.color,
}));

function countryAvg(country: 'US' | 'CN') {
  const group = MODELS.filter((m) => m.country === country);
  return RADAR_METRICS.map(({ metric, key }) => ({
    metric,
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

// ── Category badge strip ──────────────────────────────────────────────────────
function CatLeader({ label, us, cn }: { label: string; us: string; cn: string }) {
  return (
    <div className="flex-1 min-w-[160px] rounded-lg border border-slate-100 p-2.5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{label}</p>
      <div className="text-[11px] font-semibold text-indigo-600 mb-0.5">🇺🇸 {us}</div>
      <div className="text-[11px] font-semibold text-rose-500">🇨🇳 {cn}</div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AIComparisonChart() {
  const [tab, setTab] = useState<'radar' | 'bars' | 'headtohead'>('radar');

  return (
    <section className="mt-12 mb-8">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
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
            Live Arena Elo scores from{' '}
            <a href="https://arena.ai/leaderboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-600">
              arena.ai
            </a>
            {' '}· Text · Code · Vision · Reasoning · Speed · Mar 2026
          </p>
        </div>

        <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5 self-start sm:self-auto">
          {([
            ['radar', 'Spider Chart'],
            ['bars', 'Bar Chart'],
            ['headtohead', 'Head-to-Head'],
          ] as const).map(([id, label]) => (
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
          ))}
        </div>
      </div>

      {/* Category leaders strip */}
      <div className="flex flex-wrap gap-2 mb-5">
        <CatLeader label="Text #1"  us="Claude Opus 4.6"   cn="Seed 2.0" />
        <CatLeader label="Code #1"  us="Claude Opus 4.6"   cn="GLM-5" />
        <CatLeader label="Vision #1" us="Gemini 3.1 Pro"   cn="Seed 2.0" />
        <CatLeader label="Reasoning" us="Claude Opus 4.6"  cn="Seed 2.0" />
        <CatLeader label="Speed"     us="Gemini 3.1 Pro"   cn="Seed 2.0" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        {/* Model pills with live Elo */}
        <div className="flex flex-wrap gap-2 mb-6">
          {MODELS.map((m) => (
            <div
              key={m.model}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold"
              style={{ borderColor: m.color, color: m.color, background: `${m.color}12` }}
            >
              <span>{m.country === 'US' ? '🇺🇸' : '🇨🇳'}</span>
              <span>{m.shortName}</span>
              <span className="opacity-50">·</span>
              <span className="tabular-nums opacity-80">{m.textElo} text</span>
            </div>
          ))}
          <a
            href="https://arena.ai/leaderboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Live data ↗
          </a>
        </div>

        {/* ── Spider / Radar chart ── */}
        {tab === 'radar' && (
          <>
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={radarData} margin={{ top: 10, right: 50, bottom: 10, left: 50 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 700 }}
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
                    fillOpacity={0.09}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: m.color, strokeWidth: 0 }}
                  />
                ))}
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 16 }}
                  formatter={(value) => {
                    const m = MODELS.find((x) => x.shortName === value);
                    return (
                      <span style={{ color: '#475569' }}>
                        {m?.country === 'US' ? '🇺🇸' : '🇨🇳'} {value}
                        <span style={{ color: '#94a3b8', fontSize: 10 }}> ({m?.company})</span>
                      </span>
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-slate-400 mt-1">
              All axes normalized to 55–100 scale within this group. Text/Code/Vision from Arena Elo; Reasoning & Speed estimated.
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
                barCategoryGap="22%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} width={32} />
                <Tooltip content={<MetricTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="Text"      fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Code"      fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Vision"    fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Reasoning" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Speed"     fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-around text-[10px] text-slate-400 mt-1 px-8">
              <span>🇺🇸 US Models →</span>
              <span>← 🇨🇳 Chinese Models</span>
            </div>
          </>
        )}

        {/* ── Head-to-head ── */}
        {tab === 'headtohead' && (
          <>
            <div className="flex flex-wrap justify-center gap-6 mb-4 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: US_COLOR }} />
                <span className="font-semibold text-slate-700">🇺🇸 US Avg · Claude 4.6 · Gemini 3.1 · GPT-5.2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: CN_COLOR }} />
                <span className="font-semibold text-slate-700">🇨🇳 China Avg · Seed 2.0 · GLM-5 · Kimi K2.5</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={headToHeadData}
                margin={{ top: 10, right: 30, bottom: 20, left: 0 }}
                barCategoryGap="30%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} width={32} />
                <Tooltip content={<MetricTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="US Avg"    fill={US_COLOR} radius={[4, 4, 0, 0]} barSize={44} />
                <Bar dataKey="China Avg" fill={CN_COLOR} radius={[4, 4, 0, 0]} barSize={44} />
              </BarChart>
            </ResponsiveContainer>

            {/* Detailed score table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b-2 border-slate-100">
                    <th className="text-left py-2 pr-3 font-bold text-slate-500">Model</th>
                    <th className="text-center py-2 px-2 font-bold text-indigo-500">Text Elo</th>
                    <th className="text-center py-2 px-2 font-bold text-emerald-500">Code Elo</th>
                    <th className="text-center py-2 px-2 font-bold text-amber-500">Vision Elo</th>
                    <th className="text-center py-2 px-2 font-bold text-red-500">Reasoning</th>
                    <th className="text-center py-2 px-2 font-bold text-violet-500">Speed</th>
                    <th className="text-center py-2 pl-2 font-bold text-slate-500">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {MODELS.map((m) => (
                    <tr key={m.model} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base leading-none">{m.country === 'US' ? '🇺🇸' : '🇨🇳'}</span>
                          <span className="w-1.5 h-5 rounded-sm flex-shrink-0" style={{ background: m.color }} />
                          <div>
                            <div className="font-semibold text-slate-800">{m.model}</div>
                            <div className="text-[10px] text-slate-400">{m.company}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-2 px-2 tabular-nums font-bold text-indigo-600">{m.textElo}</td>
                      <td className="text-center py-2 px-2 tabular-nums font-bold text-emerald-600">
                        {m.codeElo === 1420 ? '~est' : m.codeElo}
                      </td>
                      <td className="text-center py-2 px-2 tabular-nums font-bold text-amber-600">
                        {m.visionElo === 1235 || m.visionElo === 1225 ? `~${m.visionElo}` : m.visionElo}
                      </td>
                      <td className="text-center py-2 px-2 tabular-nums text-slate-600">{m.reasoningEst}</td>
                      <td className="text-center py-2 px-2 tabular-nums text-slate-600">{m.speedEst}</td>
                      <td className="text-center py-2 pl-2 tabular-nums text-[13px] font-black" style={{ color: m.color }}>
                        {m.overall}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-50">
                    <td className="py-2 pr-3 text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                      🇺🇸 US Average
                    </td>
                    {[
                      Math.round(MODELS.filter(m=>m.country==='US').reduce((s,m)=>s+m.textElo,0)/3),
                      Math.round(MODELS.filter(m=>m.country==='US').reduce((s,m)=>s+m.codeElo,0)/3),
                      Math.round(MODELS.filter(m=>m.country==='US').reduce((s,m)=>s+m.visionElo,0)/3),
                      Math.round(MODELS.filter(m=>m.country==='US').reduce((s,m)=>s+m.reasoningEst,0)/3),
                      Math.round(MODELS.filter(m=>m.country==='US').reduce((s,m)=>s+m.speedEst,0)/3),
                      Math.round(MODELS.filter(m=>m.country==='US').reduce((s,m)=>s+m.overall,0)/3),
                    ].map((v, i) => (
                      <td key={i} className="text-center py-2 px-2 tabular-nums font-bold text-indigo-600">{v}</td>
                    ))}
                  </tr>
                  <tr className="bg-rose-50">
                    <td className="py-2 pr-3 text-[11px] font-bold text-rose-700">🇨🇳 China Average</td>
                    {[
                      Math.round(MODELS.filter(m=>m.country==='CN').reduce((s,m)=>s+m.textElo,0)/3),
                      Math.round(MODELS.filter(m=>m.country==='CN').reduce((s,m)=>s+m.codeElo,0)/3),
                      Math.round(MODELS.filter(m=>m.country==='CN').reduce((s,m)=>s+m.visionElo,0)/3),
                      Math.round(MODELS.filter(m=>m.country==='CN').reduce((s,m)=>s+m.reasoningEst,0)/3),
                      Math.round(MODELS.filter(m=>m.country==='CN').reduce((s,m)=>s+m.speedEst,0)/3),
                      Math.round(MODELS.filter(m=>m.country==='CN').reduce((s,m)=>s+m.overall,0)/3),
                    ].map((v, i) => (
                      <td key={i} className="text-center py-2 px-2 tabular-nums font-bold text-rose-600">{v}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      <p className="mt-2 text-[10px] text-slate-400 text-right">
        Text / Code / Vision Elo from{' '}
        <a href="https://arena.ai/leaderboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">arena.ai</a>
        {' '}· ~est = not in top 25 for that category, score estimated · Reasoning & Speed estimated · Mar 2026
      </p>
    </section>
  );
}
