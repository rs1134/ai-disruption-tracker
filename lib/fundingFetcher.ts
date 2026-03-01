/**
 * fundingFetcher.ts
 * Parses AI funding news from Google News RSS and tries to extract structured
 * funding round data to auto-populate the DB with fresh rounds.
 */

import { upsertFundingRound, ensureFundingTable } from './funding';

interface ParsedRound {
  id: string;
  companyName: string;
  fundingAmountM: number | null;
  fundingDisplay: string;
  roundType: string;
  investors: string[];
  industry: string;
  location: string;
  announcedDate: string;
  sourceUrl: string;
  description: string;
  valuationDisplay: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Convert amount string like "$1.5B", "€600M", "$40M" → number in millions */
function parseAmountToM(raw: string): number | null {
  const m = raw.replace(/,/g, '').match(/([\d.]+)\s*([BMK])/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  if (unit === 'B') return Math.round(n * 1000);
  if (unit === 'M') return Math.round(n);
  if (unit === 'K') return Math.round(n / 1000);
  return null;
}

/** Guess round type from text */
function guessRoundType(text: string): string {
  const t = text.toLowerCase();
  if (/series\s+[a-h]/i.test(t)) {
    const m = t.match(/series\s+([a-h])/i);
    return m ? `Series ${m[1].toUpperCase()}` : 'Series';
  }
  if (t.includes('seed')) return 'Seed';
  if (t.includes('pre-seed') || t.includes('preseed')) return 'Pre-Seed';
  if (t.includes('strategic')) return 'Strategic';
  if (t.includes('ipo') || t.includes('public offering')) return 'IPO';
  if (t.includes('acquisition') || t.includes('acquires') || t.includes('acquired')) return 'Acquisition';
  if (t.includes('grant')) return 'Grant';
  return 'Undisclosed';
}

/** Guess industry from text */
function guessIndustry(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('robot')) return 'AI Robotics';
  if (t.includes('self-driving') || t.includes('autonomous vehicle') || t.includes('waymo') || t.includes('cruise')) return 'Autonomous Vehicles';
  if (t.includes('drug') || t.includes('pharma') || t.includes('medic') || t.includes('health') || t.includes('genomic')) return 'AI Healthcare';
  if (t.includes('legal') || t.includes('law firm') || t.includes('attorney')) return 'AI Legal';
  if (t.includes('security') || t.includes('cybersec')) return 'AI Security';
  if (t.includes('code') || t.includes('coding') || t.includes('developer') || t.includes('programming')) return 'AI Dev Tools';
  if (t.includes('search') || t.includes('perplexity')) return 'AI Search';
  if (t.includes('video') || t.includes('animation')) return 'AI Video';
  if (t.includes('audio') || t.includes('voice') || t.includes('speech') || t.includes('music')) return 'AI Audio';
  if (t.includes('chip') || t.includes('semiconductor') || t.includes('hardware') || t.includes('inference') || t.includes('gpu')) return 'AI Infrastructure';
  if (t.includes('enterprise') || t.includes('b2b') || t.includes('saas')) return 'AI Enterprise';
  if (t.includes('agent')) return 'AI Agents';
  if (t.includes('open source') || t.includes('open-source') || t.includes('hugging')) return 'AI Open Source';
  if (t.includes('safety') || t.includes('alignment')) return 'AI Safety';
  if (t.includes('customer service') || t.includes('support') || t.includes('chatbot')) return 'AI Customer Service';
  if (t.includes('data') || t.includes('dataset') || t.includes('annotation')) return 'AI Data';
  if (t.includes('model') || t.includes('foundation') || t.includes('llm') || t.includes('language model')) return 'AI Foundation Models';
  return 'AI Platform';
}

/** Guess location from text */
function guessLocation(text: string): string {
  const t = text;
  if (/beijing|china|shanghai|hangzhou|shenzhen/i.test(t)) return 'China';
  if (/london|uk|united kingdom/i.test(t)) return 'London, UK';
  if (/paris|france/i.test(t)) return 'Paris, France';
  if (/toronto|canada/i.test(t)) return 'Toronto, Canada';
  if (/new york/i.test(t)) return 'New York, US';
  if (/seattle/i.test(t)) return 'Seattle, US';
  if (/san francisco|sf bay|silicon valley|palo alto|menlo park|mountain view/i.test(t)) return 'San Francisco, US';
  if (/israel|tel aviv/i.test(t)) return 'Tel Aviv, Israel';
  if (/india|bangalore|bengaluru/i.test(t)) return 'India';
  if (/singapore/i.test(t)) return 'Singapore';
  return 'US';
}

// ── RSS fetch & parse ─────────────────────────────────────────────────────────

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

function getTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
}

function parseRssItems(xml: string): RssItem[] {
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  return itemBlocks.map(block => ({
    title: getTag(block, 'title'),
    link: getTag(block, 'link'),
    pubDate: getTag(block, 'pubDate'),
    description: getTag(block, 'description'),
  }));
}

async function fetchRssItems(url: string): Promise<RssItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AI-Disruption-Tracker/1.0 (+https://ai-disruption-tracker.vercel.app)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml);
  } catch {
    return [];
  }
}

// ── Main extraction ───────────────────────────────────────────────────────────

/**
 * Attempt to extract a funding round from a news headline + description.
 * Returns null if we can't find an amount (too noisy).
 */
function extractRound(item: RssItem): ParsedRound | null {
  const fullText = `${item.title} ${item.description}`;

  // Must contain a dollar/euro amount
  const amountMatch = fullText.match(/[€$£¥]\s*([\d,.]+)\s*([BMK])/i);
  if (!amountMatch) return null;

  const rawAmount = amountMatch[0];
  const fundingAmountM = parseAmountToM(rawAmount);
  if (!fundingAmountM || fundingAmountM < 5) return null; // skip < $5M (too noisy)

  // Extract display amount
  const fundingDisplay = rawAmount.replace(/\s+/g, '');

  // Extract company name — typically the first proper noun before "raises" / "secures" / "closes"
  const companyMatch = item.title.match(/^([A-Z][A-Za-z0-9\s.,'&-]{2,40?}?)\s+(?:raises?|secures?|closes?|lands?|gets?|nets?|bags?|announces?|completes?)/i);
  const companyName = companyMatch ? companyMatch[1].trim() : '';
  if (!companyName) return null;

  // Parse date
  let announcedDate = today();
  if (item.pubDate) {
    try {
      announcedDate = new Date(item.pubDate).toISOString().slice(0, 10);
    } catch { /* keep today */ }
  }

  const roundType = guessRoundType(fullText);
  const industry = guessIndustry(fullText);
  const location = guessLocation(fullText);

  // Build stable ID
  const dateStr = announcedDate.slice(0, 7).replace('-', '');
  const id = `${slugify(companyName)}-${slugify(fundingDisplay)}-${dateStr}`;

  return {
    id,
    companyName,
    fundingAmountM,
    fundingDisplay,
    roundType,
    investors: [],
    industry,
    location,
    announcedDate,
    sourceUrl: item.link,
    description: item.title,
    valuationDisplay: null,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

const FUNDING_RSS_FEEDS = [
  // Google News: AI startup funding
  'https://news.google.com/rss/search?q=AI+startup+funding+million+billion&hl=en-US&gl=US&ceid=US:en',
  // Google News: AI raises funding round
  'https://news.google.com/rss/search?q=%22raises%22+%22AI%22+%22funding%22+%22million%22&hl=en-US&gl=US&ceid=US:en',
  // TechCrunch fundings
  'https://techcrunch.com/category/fundings-exits/feed/',
  // VentureBeat AI
  'https://venturebeat.com/category/ai/feed/',
];

export interface FetchResult {
  fetched: number;
  inserted: number;
  skipped: number;
  errors: number;
}

export async function fetchAndStoreFundingRounds(): Promise<FetchResult> {
  await ensureFundingTable();

  let fetched = 0;
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  const seen = new Set<string>();

  for (const url of FUNDING_RSS_FEEDS) {
    const items = await fetchRssItems(url);
    fetched += items.length;

    for (const item of items) {
      const round = extractRound(item);
      if (!round) { skipped++; continue; }
      if (seen.has(round.id)) { skipped++; continue; }
      seen.add(round.id);

      try {
        await upsertFundingRound({
          ...round,
          valuationDisplay: round.valuationDisplay ?? undefined,
        });
        inserted++;
      } catch {
        errors++;
      }
    }
  }

  return { fetched, inserted, skipped, errors };
}
