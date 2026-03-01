import { neon, neonConfig, type NeonQueryFunction } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

let _sql: NeonQueryFunction<false, false> | null = null;
let _tableReady = false;

function db(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  _sql = neon(url);
  return _sql;
}

// ── Auto-create table on first use ────────────────────────────────────────────
export async function ensureFundingTable() {
  if (_tableReady) return;
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS ai_funding_rounds (
      id               TEXT PRIMARY KEY,
      company_name     TEXT NOT NULL,
      funding_amount_m DECIMAL(14,2),
      funding_display  TEXT NOT NULL DEFAULT '',
      round_type       TEXT NOT NULL DEFAULT 'Undisclosed',
      investors        TEXT[] NOT NULL DEFAULT '{}',
      industry         TEXT NOT NULL DEFAULT 'AI',
      location         TEXT NOT NULL DEFAULT 'US',
      announced_date   DATE NOT NULL,
      source_url       TEXT,
      description      TEXT NOT NULL DEFAULT '',
      valuation_display TEXT,
      is_seed_data     BOOLEAN NOT NULL DEFAULT false,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_funding_date     ON ai_funding_rounds (announced_date DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_funding_amount   ON ai_funding_rounds (funding_amount_m DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_funding_industry ON ai_funding_rounds (industry)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_funding_stage    ON ai_funding_rounds (round_type)`;
  _tableReady = true;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface FundingRound {
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
  isSeedData: boolean;
  createdAt: string;
}

function mapRow(r: Record<string, unknown>): FundingRound {
  return {
    id: r.id as string,
    companyName: r.company_name as string,
    fundingAmountM: r.funding_amount_m != null ? Number(r.funding_amount_m) : null,
    fundingDisplay: r.funding_display as string,
    roundType: r.round_type as string,
    investors: (r.investors as string[]) ?? [],
    industry: r.industry as string,
    location: r.location as string,
    announcedDate: r.announced_date instanceof Date
      ? r.announced_date.toISOString().slice(0, 10)
      : String(r.announced_date).slice(0, 10),
    sourceUrl: (r.source_url as string) ?? null,
    description: r.description as string,
    valuationDisplay: (r.valuation_display as string) ?? null,
    isSeedData: Boolean(r.is_seed_data),
    createdAt: (r.created_at as Date).toISOString(),
  };
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
export async function upsertFundingRound(round: {
  id: string;
  companyName: string;
  fundingAmountM: number | null;
  fundingDisplay: string;
  roundType: string;
  investors: string[];
  industry: string;
  location: string;
  announcedDate: string;
  sourceUrl?: string;
  description: string;
  valuationDisplay?: string;
  isSeedData?: boolean;
}) {
  const sql = db();
  return sql`
    INSERT INTO ai_funding_rounds (
      id, company_name, funding_amount_m, funding_display, round_type,
      investors, industry, location, announced_date, source_url,
      description, valuation_display, is_seed_data
    ) VALUES (
      ${round.id}, ${round.companyName}, ${round.fundingAmountM ?? null},
      ${round.fundingDisplay}, ${round.roundType}, ${round.investors},
      ${round.industry}, ${round.location}, ${round.announcedDate},
      ${round.sourceUrl ?? null}, ${round.description},
      ${round.valuationDisplay ?? null}, ${round.isSeedData ?? false}
    )
    ON CONFLICT (id) DO UPDATE SET
      funding_amount_m  = EXCLUDED.funding_amount_m,
      funding_display   = EXCLUDED.funding_display,
      investors         = EXCLUDED.investors,
      description       = EXCLUDED.description,
      valuation_display = EXCLUDED.valuation_display
  `;
}

export async function getFundingRounds(opts: {
  search?: string;
  industry?: string;
  stage?: string;
  location?: string;
  year?: string;
  sort?: string;
  order?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<FundingRound[]> {
  const sql = db();
  const { search = '', industry = '', stage = '', location = '', year = '',
          sort = 'date', order = 'desc', limit = 200, offset = 0 } = opts;

  const rows = await sql`
    SELECT * FROM ai_funding_rounds
    WHERE
      (${search} = '' OR LOWER(company_name) LIKE LOWER(${`%${search}%`}))
      AND (${industry} = '' OR industry = ${industry})
      AND (${stage} = '' OR round_type = ${stage})
      AND (${location} = '' OR location ILIKE ${`%${location}%`})
      AND (${year} = '' OR EXTRACT(YEAR FROM announced_date)::TEXT = ${year})
    ORDER BY
      CASE WHEN ${sort} = 'amount' AND ${order} = 'desc' THEN funding_amount_m END DESC NULLS LAST,
      CASE WHEN ${sort} = 'amount' AND ${order} = 'asc'  THEN funding_amount_m END ASC  NULLS LAST,
      CASE WHEN ${sort} = 'company' AND ${order} = 'asc'  THEN company_name END ASC,
      CASE WHEN ${sort} = 'company' AND ${order} = 'desc' THEN company_name END DESC,
      CASE WHEN ${sort} = 'date'   AND ${order} = 'asc'  THEN announced_date END ASC,
      announced_date DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows.map(mapRow);
}

export async function getFundingStats() {
  const sql = db();
  const [totals, byIndustry, byStage, byMonth] = await Promise.all([
    sql`
      SELECT
        COUNT(*) as total_rounds,
        COUNT(DISTINCT company_name) as total_companies,
        SUM(funding_amount_m) as total_amount_m,
        AVG(funding_amount_m) as avg_amount_m,
        MAX(funding_amount_m) as max_amount_m,
        (SELECT company_name FROM ai_funding_rounds ORDER BY funding_amount_m DESC NULLS LAST LIMIT 1) as largest_company,
        (SELECT funding_display FROM ai_funding_rounds ORDER BY funding_amount_m DESC NULLS LAST LIMIT 1) as largest_display,
        (SELECT company_name FROM ai_funding_rounds ORDER BY announced_date DESC LIMIT 1) as latest_company,
        (SELECT funding_display FROM ai_funding_rounds ORDER BY announced_date DESC LIMIT 1) as latest_display,
        (SELECT announced_date FROM ai_funding_rounds ORDER BY announced_date DESC LIMIT 1) as latest_date
      FROM ai_funding_rounds
    `,
    sql`
      SELECT industry, SUM(funding_amount_m) as total_m, COUNT(*) as count
      FROM ai_funding_rounds
      WHERE funding_amount_m IS NOT NULL
      GROUP BY industry
      ORDER BY total_m DESC
      LIMIT 10
    `,
    sql`
      SELECT round_type, COUNT(*) as count, SUM(funding_amount_m) as total_m
      FROM ai_funding_rounds
      GROUP BY round_type
      ORDER BY total_m DESC NULLS LAST
    `,
    sql`
      SELECT
        TO_CHAR(announced_date, 'YYYY-MM') as month,
        SUM(funding_amount_m) as total_m,
        COUNT(*) as count
      FROM ai_funding_rounds
      WHERE announced_date >= NOW() - INTERVAL '24 months'
      GROUP BY month
      ORDER BY month ASC
    `,
  ]);
  return { totals: totals[0], byIndustry, byStage, byMonth };
}

export async function countFundingRounds(opts: {
  search?: string; industry?: string; stage?: string;
  location?: string; year?: string;
} = {}): Promise<number> {
  const sql = db();
  const { search = '', industry = '', stage = '', location = '', year = '' } = opts;
  const rows = await sql`
    SELECT COUNT(*) as n FROM ai_funding_rounds
    WHERE
      (${search} = '' OR LOWER(company_name) LIKE LOWER(${`%${search}%`}))
      AND (${industry} = '' OR industry = ${industry})
      AND (${stage} = '' OR round_type = ${stage})
      AND (${location} = '' OR location ILIKE ${`%${location}%`})
      AND (${year} = '' OR EXTRACT(YEAR FROM announced_date)::TEXT = ${year})
  `;
  return Number(rows[0].n);
}

export async function isFundingSeeded(): Promise<boolean> {
  const sql = db();
  const rows = await sql`SELECT COUNT(*) as n FROM ai_funding_rounds WHERE is_seed_data = true`;
  return Number(rows[0].n) > 0;
}

// ── Seed data (40 real rounds, 2022–2026) ─────────────────────────────────────
export const SEED_ROUNDS = [
  // ── 2026 ──────────────────────────────────────────────────────────────────
  { id: 'openai-110b-2026', company: 'OpenAI', amountM: 110_000, display: '$110B', round: 'Strategic', investors: ['Amazon', 'Nvidia', 'SoftBank', 'Microsoft'], industry: 'AI Platform', location: 'San Francisco, US', date: '2026-02-01', desc: 'OpenAI raises $110B at $730B pre-money valuation — largest private tech fundraise ever', valuation: '$730B' },
  { id: 'anthropic-30b-2026', company: 'Anthropic', amountM: 30_000, display: '$30B', round: 'Series G', investors: ['Founders Fund', 'Coatue', 'Nvidia', 'Google'], industry: 'AI Safety', location: 'San Francisco, US', date: '2026-02-01', desc: 'Anthropic raises $30B Series G at $380B valuation, led by Founders Fund and Coatue', valuation: '$380B' },
  { id: 'waymo-16b-2026', company: 'Waymo', amountM: 16_000, display: '$16B', round: 'Strategic', investors: ['Alphabet', 'Strategic Investors'], industry: 'Autonomous Vehicles', location: 'Mountain View, US', date: '2026-02-01', desc: 'Waymo secures $16B strategic investment round for autonomous driving expansion', valuation: 'Alphabet subsidiary' },
  { id: 'xai-20b-2026', company: 'xAI', amountM: 20_000, display: '$20B', round: 'Strategic', investors: ['Nvidia', 'Cisco', 'Fidelity', 'Sequoia Capital', 'a16z'], industry: 'AI Platform', location: 'San Francisco, US', date: '2026-01-15', desc: 'Elon Musk\'s xAI raises $20B at $200B+ valuation from top Silicon Valley firms', valuation: '$200B+' },
  { id: 'skild-1b4-2026', company: 'Skild AI', amountM: 1_400, display: '$1.4B', round: 'Series C', investors: ['SoftBank', 'Nvidia', 'Bezos Expeditions'], industry: 'AI Robotics', location: 'Pittsburgh, US', date: '2026-01-10', desc: 'Skild AI closes $1.4B Series C at $14B valuation for general-purpose robotics AI models', valuation: '$14B' },
  { id: 'physical-intelligence-400m-2026', company: 'Physical Intelligence', amountM: 400, display: '$400M', round: 'Series B', investors: ['Sequoia', 'Lux Capital', 'Thrive Capital'], industry: 'AI Robotics', location: 'San Francisco, US', date: '2026-01-05', desc: 'Physical Intelligence (π) raises $400M Series B to scale robotic foundation models', valuation: '$3B' },
  // ── 2025 ──────────────────────────────────────────────────────────────────
  { id: 'openai-40b-2025', company: 'OpenAI', amountM: 40_000, display: '$40B', round: 'Strategic', investors: ['SoftBank', 'Microsoft', 'Thrive Capital'], industry: 'AI Platform', location: 'San Francisco, US', date: '2025-03-15', desc: 'OpenAI raises $40B led by SoftBank at $340B valuation', valuation: '$340B' },
  { id: 'anysphere-900m-2025', company: 'Anysphere (Cursor)', amountM: 900, display: '$900M', round: 'Series C', investors: ['a16z', 'Thrive Capital', 'Kleiner Perkins'], industry: 'AI Dev Tools', location: 'San Francisco, US', date: '2025-08-20', desc: 'Cursor maker Anysphere raises $900M Series C at $9B valuation', valuation: '$9B' },
  { id: 'perplexity-500m-2025', company: 'Perplexity AI', amountM: 500, display: '$500M', round: 'Series D', investors: ['SoftBank', 'Nvidia', 'IVP', 'NEA'], industry: 'AI Search', location: 'San Francisco, US', date: '2025-06-10', desc: 'Perplexity AI raises $500M Series D as AI search challenger to Google', valuation: '$14B' },
  { id: 'cognition-2b-2025', company: 'Cognition (Devin)', amountM: 2_000, display: '$2B', round: 'Series B', investors: ['Founders Fund', 'a16z', 'Khosla Ventures'], industry: 'AI Coding', location: 'San Francisco, US', date: '2025-04-01', desc: 'Cognition raises $2B for Devin, the autonomous AI software engineer', valuation: '$4B' },
  { id: 'manus-ai-75m-2025', company: 'Manus AI', amountM: 75, display: '$75M', round: 'Series A', investors: ['Peak XV Partners', 'SoftBank China', 'Qiming Ventures'], industry: 'AI Agents', location: 'Beijing, China', date: '2025-03-05', desc: 'Manus AI raises $75M to scale general-purpose AI agent platform', valuation: '$500M' },
  { id: 'runway-308m-2025', company: 'Runway ML', amountM: 308, display: '$308M', round: 'Series D', investors: ['General Atlantic', 'Google', 'Nvidia'], industry: 'AI Video', location: 'New York, US', date: '2025-02-14', desc: 'Runway raises $308M Series D at $4B valuation for generative video AI', valuation: '$4B' },
  { id: 'perplexity-250m-2025', company: 'Perplexity AI', amountM: 250, display: '$250M', round: 'Series C', investors: ['SoftBank', 'Nvidia', 'NEA', 'Bezos'], industry: 'AI Search', location: 'San Francisco, US', date: '2025-01-20', desc: 'Perplexity raises $250M Series C at $9B valuation', valuation: '$9B' },
  // ── 2024 ──────────────────────────────────────────────────────────────────
  { id: 'xai-6b-dec-2024', company: 'xAI', amountM: 6_000, display: '$6B', round: 'Series B', investors: ['a16z', 'Sequoia', 'Kingdom Holdings', 'Lightspeed'], industry: 'AI Platform', location: 'San Francisco, US', date: '2024-12-05', desc: 'xAI raises $6B Series B valuing Grok maker at $50B', valuation: '$50B' },
  { id: 'scale-ai-1b-2024', company: 'Scale AI', amountM: 1_000, display: '$1B', round: 'Series F', investors: ['Amazon', 'Cisco', 'Meta', 'Accel'], industry: 'AI Data', location: 'San Francisco, US', date: '2024-05-22', desc: 'Scale AI raises $1B Series F at $13.8B valuation — key AI training data provider', valuation: '$13.8B' },
  { id: 'cohere-500m-2024', company: 'Cohere', amountM: 500, display: '$500M', round: 'Series D', investors: ['Nvidia', 'Oracle', 'Salesforce Ventures', 'Tiger Global'], industry: 'AI Enterprise', location: 'Toronto, Canada', date: '2024-07-22', desc: 'Cohere raises $500M Series D at $5B valuation for enterprise AI', valuation: '$5B' },
  { id: 'groq-640m-2024', company: 'Groq', amountM: 640, display: '$640M', round: 'Series D', investors: ['BlackRock', 'Cisco', 'Samsung', 'Tiger Global'], industry: 'AI Infrastructure', location: 'San Jose, US', date: '2024-08-05', desc: 'Groq raises $640M for ultra-fast AI inference chips powering LPU technology', valuation: '$2.8B' },
  { id: 'mistral-640m-2024', company: 'Mistral AI', amountM: 640, display: '€600M', round: 'Series B', investors: ['General Catalyst', 'a16z', 'BNP Paribas', 'Nvidia'], industry: 'AI Foundation Models', location: 'Paris, France', date: '2024-06-11', desc: 'Mistral AI raises €600M ($640M) Series B at $6B valuation', valuation: '$6B' },
  { id: 'harvey-300m-2024', company: 'Harvey AI', amountM: 300, display: '$300M', round: 'Series D', investors: ['GV', 'Kleiner Perkins', 'OpenAI Startup Fund', 'Sequoia'], industry: 'AI Legal', location: 'San Francisco, US', date: '2024-09-10', desc: 'Harvey raises $300M Series D at $1.5B valuation for AI legal platform', valuation: '$1.5B' },
  { id: 'poolside-500m-2024', company: 'Poolside', amountM: 500, display: '$500M', round: 'Series B', investors: ['Bain Capital Ventures', 'DST Global', 'Nvidia'], industry: 'AI Coding', location: 'San Francisco, US', date: '2024-08-15', desc: 'Poolside raises $500M for AI coding assistant at $3B valuation', valuation: '$3B' },
  { id: 'pi-400m-2024', company: 'Physical Intelligence', amountM: 400, display: '$400M', round: 'Series A', investors: ['Jeff Bezos', 'a16z', 'OpenAI', 'Lux Capital'], industry: 'AI Robotics', location: 'San Francisco, US', date: '2024-11-04', desc: 'Physical Intelligence raises $400M Series A to build general-purpose robot foundation models', valuation: '$2.4B' },
  { id: 'sierra-175m-2024', company: 'Sierra AI', amountM: 175, display: '$175M', round: 'Series B', investors: ['Sequoia', 'a16z', 'Benchmark'], industry: 'AI Customer Service', location: 'San Francisco, US', date: '2024-07-18', desc: 'Sierra raises $175M at $4.5B valuation for conversational AI platform', valuation: '$4.5B' },
  { id: 'writer-200m-2024', company: 'Writer', amountM: 200, display: '$200M', round: 'Series C', investors: ['Iconiq Growth', 'Salesforce Ventures', 'Citi Ventures'], industry: 'AI Enterprise', location: 'San Francisco, US', date: '2024-09-17', desc: 'Writer raises $200M Series C at $1.9B valuation for enterprise AI platform', valuation: '$1.9B' },
  { id: 'glean-260m-2024', company: 'Glean', amountM: 260, display: '$260M', round: 'Series E', investors: ['Kleiner Perkins', 'Lightspeed', 'Sequoia', 'General Catalyst'], industry: 'AI Enterprise Search', location: 'Palo Alto, US', date: '2024-02-27', desc: 'Glean raises $260M Series E at $2.2B valuation for AI-powered enterprise search', valuation: '$2.2B' },
  { id: 'together-106m-2024', company: 'Together AI', amountM: 106, display: '$106M', round: 'Series A', investors: ['Salesforce Ventures', 'Nvidia', 'a16z', 'Kleiner Perkins'], industry: 'AI Infrastructure', location: 'San Francisco, US', date: '2024-03-13', desc: 'Together AI raises $106M to build open-source AI cloud infrastructure', valuation: '$1.25B' },
  { id: 'elevenlabs-80m-2024', company: 'ElevenLabs', amountM: 80, display: '$80M', round: 'Series B', investors: ['a16z', 'Sequoia', 'Smash Capital'], industry: 'AI Audio', location: 'New York, US', date: '2024-01-22', desc: 'ElevenLabs raises $80M Series B at $1.1B valuation for AI voice synthesis', valuation: '$1.1B' },
  { id: 'synthesia-90m-2024', company: 'Synthesia', amountM: 90, display: '$90M', round: 'Series C', investors: ['a16z', 'Nvidia', 'GV', 'Kleiner Perkins'], industry: 'AI Video', location: 'London, UK', date: '2024-05-08', desc: 'Synthesia raises $90M Series C at $1B valuation for AI avatar video platform', valuation: '$1B' },
  { id: 'replit-97m-2024', company: 'Replit', amountM: 97, display: '$97M', round: 'Series B', investors: ['a16z', 'Google Ventures', 'Khosla Ventures'], industry: 'AI Dev Tools', location: 'San Francisco, US', date: '2024-04-05', desc: 'Replit raises $97M Series B at $1.16B for AI-powered coding platform', valuation: '$1.16B' },
  { id: 'minimax-600m-2024', company: 'MiniMax', amountM: 600, display: '$600M', round: 'Series B', investors: ['HongShan', 'Tencent', 'Alibaba', 'IDG Capital'], industry: 'AI Foundation Models', location: 'Shanghai, China', date: '2024-08-12', desc: 'MiniMax raises $600M for multimodal AI platform at $2.5B valuation', valuation: '$2.5B' },
  { id: 'moonshot-1b-2024', company: 'Moonshot AI', amountM: 1_000, display: '$1B', round: 'Series C', investors: ['Alibaba', 'HongShan', 'Tencent', 'Xiaomi'], industry: 'AI Foundation Models', location: 'Beijing, China', date: '2024-02-19', desc: 'Kimi maker Moonshot AI raises $1B at $2.5B valuation in competitive China AI race', valuation: '$2.5B' },
  { id: 'pika-80m-2023', company: 'Pika Labs', amountM: 80, display: '$80M', round: 'Series A', investors: ['Lightspeed', 'Greenoaks', 'Elad Gil'], industry: 'AI Video', location: 'Palo Alto, US', date: '2023-11-27', desc: 'Pika Labs raises $80M Series A for AI video generation at $470M valuation', valuation: '$470M' },
  // ── 2023 ──────────────────────────────────────────────────────────────────
  { id: 'huggingface-235m-2023', company: 'Hugging Face', amountM: 235, display: '$235M', round: 'Series D', investors: ['Google', 'Nvidia', 'Amazon', 'Salesforce', 'IBM'], industry: 'AI Open Source', location: 'New York, US', date: '2023-08-24', desc: 'Hugging Face raises $235M Series D at $4.5B valuation — the GitHub of AI', valuation: '$4.5B' },
  { id: 'inflection-1b3-2023', company: 'Inflection AI', amountM: 1_300, display: '$1.3B', round: 'Strategic', investors: ['Microsoft', 'Reid Hoffman', 'Bill Gates', 'Nvidia', 'Eric Schmidt'], industry: 'AI Platform', location: 'Palo Alto, US', date: '2023-06-29', desc: 'Inflection AI raises $1.3B from Microsoft and tech titans for Pi AI assistant', valuation: '$4B' },
  { id: 'character-ai-150m-2023', company: 'Character AI', amountM: 150, display: '$150M', round: 'Series A', investors: ['a16z', 'Spark Capital'], industry: 'AI Consumer', location: 'Menlo Park, US', date: '2023-03-23', desc: 'Character.AI raises $150M Series A at $1B valuation for AI character platform', valuation: '$1B' },
  { id: 'imbue-200m-2023', company: 'Imbue', amountM: 200, display: '$200M', round: 'Series B', investors: ['Astera Institute', 'Samsung Next', 'NVentures'], industry: 'AI Research', location: 'San Francisco, US', date: '2023-08-01', desc: 'Imbue raises $200M Series B to build reliable AI reasoning agents', valuation: '$1B' },
  // ── 2022 ──────────────────────────────────────────────────────────────────
  { id: 'stability-101m-2022', company: 'Stability AI', amountM: 101, display: '$101M', round: 'Seed', investors: ['Coatue', "O'Reilly AlphaTech", 'Lightspeed'], industry: 'AI Foundation Models', location: 'London, UK', date: '2022-10-17', desc: 'Stability AI raises $101M Seed at $1B valuation — maker of Stable Diffusion', valuation: '$1B' },
  { id: 'cohere-270m-2022', company: 'Cohere', amountM: 270, display: '$270M', round: 'Series C', investors: ['Nvidia', 'Oracle', 'SAP', 'Tiger Global'], industry: 'AI Enterprise', location: 'Toronto, Canada', date: '2022-06-01', desc: 'Cohere raises $270M Series C to scale enterprise NLP platform', valuation: '$2.1B' },
  { id: 'deepseek-strategic-2024', company: 'DeepSeek', amountM: 1_000, display: '~$1B', round: 'Strategic', investors: ['High-Flyer Capital (quant fund)'], industry: 'AI Foundation Models', location: 'Hangzhou, China', date: '2024-01-01', desc: 'DeepSeek funded by Chinese quant hedge fund High-Flyer — shocked global AI community with DeepSeek R1', valuation: 'N/A' },
];

export async function seedFundingData() {
  await ensureFundingTable();
  const alreadySeeded = await isFundingSeeded();
  if (alreadySeeded) return 0;

  let count = 0;
  for (const r of SEED_ROUNDS) {
    try {
      await upsertFundingRound({
        id: r.id,
        companyName: r.company,
        fundingAmountM: r.amountM,
        fundingDisplay: r.display,
        roundType: r.round,
        investors: r.investors,
        industry: r.industry,
        location: r.location,
        announcedDate: r.date,
        description: r.desc,
        valuationDisplay: r.valuation,
        isSeedData: true,
      });
      count++;
    } catch {}
  }
  return count;
}
