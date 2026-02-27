import type { Category } from '@/types';

// ── Category detection ────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  Layoffs: [
    'layoff', 'layoffs', 'laid off', 'job cut', 'job cuts', 'firing',
    'fired', 'workforce reduction', 'headcount reduction', 'downsizing',
    'restructuring', 'redundan', 'rif ', 'reduction in force',
  ],
  Funding: [
    'funding', 'raises', 'raised', 'series a', 'series b', 'series c',
    'seed round', 'investment', 'investor', 'valuation', 'unicorn',
    'billion', 'million', 'vc ', 'venture capital', 'capital', 'ipo',
    'pre-ipo', 'backed by',
  ],
  'Product Launch': [
    'launch', 'launches', 'released', 'release', 'unveil', 'unveils',
    'announce', 'announces', 'debut', 'new model', 'new product',
    'new feature', 'introducing', 'now available', 'ships', 'shipping',
    'rolls out', 'gpt-', 'claude ', 'gemini', 'llm release',
  ],
  Regulation: [
    'regulation', 'regulate', 'regulator', 'ban', 'banned', 'law',
    'legislation', 'congress', 'senate', 'eu ai', 'ai act', 'policy',
    'compliance', 'fine', 'lawsuit', 'antitrust', 'investigation',
    'probe', 'ftc', 'doj', 'sec', 'audit', 'safety board',
  ],
  Breakthrough: [
    'breakthrough', 'groundbreaking', 'state of the art', 'sota',
    'achieves', 'surpasses', 'human-level', 'superhuman', 'agi',
    'superintelligence', 'benchmark', 'record', 'milestone', 'first ever',
    'revolutionary', 'discovery', 'research paper', 'arxiv',
  ],
  Acquisition: [
    'acqui', 'acquires', 'acquired', 'merger', 'merges', 'buyout',
    'takeover', 'purchase', 'deal', 'billion deal', 'buys', 'bought',
  ],
  General: [],
};

export function detectCategory(text: string): Category {
  const lower = text.toLowerCase();
  const scores: Partial<Record<Category, number>> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    if (category === 'General') continue;
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > 0) scores[category] = score;
  }

  if (Object.keys(scores).length === 0) return 'General';
  return (Object.entries(scores) as [Category, number][]).reduce(
    (best, [cat, sc]) => (sc > (scores[best] ?? 0) ? cat : best),
    Object.keys(scores)[0] as Category
  );
}

// ── Keyword / tag extraction ──────────────────────────────────

const KNOWN_COMPANIES = [
  'OpenAI', 'Anthropic', 'Google', 'Meta', 'Microsoft', 'Apple', 'Amazon',
  'Nvidia', 'Tesla', 'xAI', 'Mistral', 'Cohere', 'Stability AI', 'Midjourney',
  'Hugging Face', 'DeepMind', 'Gemini', 'Claude', 'ChatGPT', 'Copilot',
  'Perplexity', 'Character.AI', 'Inflection', 'Runway', 'ElevenLabs',
  'Scale AI', 'Databricks', 'Together AI', 'Groq', 'Cerebras',
];

const TOPIC_KEYWORDS = [
  'AI', 'LLM', 'AGI', 'GPT', 'machine learning', 'deep learning',
  'neural network', 'computer vision', 'NLP', 'robotics', 'automation',
  'chatbot', 'generative AI', 'foundation model', 'fine-tuning', 'inference',
];

export function extractTags(text: string): string[] {
  const found = new Set<string>();

  // Company names (case-sensitive match)
  for (const company of KNOWN_COMPANIES) {
    if (text.toLowerCase().includes(company.toLowerCase())) {
      found.add(company);
    }
  }

  // Topic keywords
  for (const kw of TOPIC_KEYWORDS) {
    if (text.toLowerCase().includes(kw.toLowerCase())) {
      found.add(kw);
    }
  }

  return Array.from(found).slice(0, 8);
}

export function extractMentionedCompanies(text: string): string[] {
  return KNOWN_COMPANIES.filter((c) =>
    text.toLowerCase().includes(c.toLowerCase())
  );
}

// ── Relevance filtering ───────────────────────────────────────

const AI_REQUIRED_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt', 'openai',
  'anthropic', 'deepmind', 'chatgpt', 'generative', 'agi', 'neural',
  'automation', 'robot', 'claude', 'gemini', 'copilot', 'mistral',
];

export function isAiRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return AI_REQUIRED_KEYWORDS.some((kw) => lower.includes(kw));
}

// ── Deduplication ─────────────────────────────────────────────

export function deduplicateItems<T extends { title: string; url: string }>(
  items: T[]
): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    // Normalise title for fuzzy dedup
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Numeric extraction helpers ────────────────────────────────

export function extractFundingAmount(text: string): string | null {
  const match = text.match(
    /\$?([\d,.]+)\s*(billion|million|b|m)\b/i
  );
  if (!match) return null;
  const num = parseFloat(match[1].replace(/,/g, ''));
  const unit = match[2].toLowerCase();
  if (unit === 'billion' || unit === 'b') return `$${num}B`;
  if (unit === 'million' || unit === 'm') return `$${num}M`;
  return null;
}

export function extractLayoffNumbers(text: string): number | null {
  const patterns = [
    /(\d[\d,]*)\s*(employees?|workers?|people|jobs?)\s*(laid off|cut|fired|let go)/i,
    /laid off\s+(\d[\d,]*)/i,
    /cut(ting)?\s+(\d[\d,]*)\s*(jobs?|positions?|roles?)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numStr = (match[1] || match[2] || '').replace(/,/g, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return null;
}
