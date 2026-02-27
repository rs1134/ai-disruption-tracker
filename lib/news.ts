import type { FeedItem, NewsArticle } from '@/types';
import { detectCategory, extractTags, isAiRelevant, deduplicateItems } from './nlp';
import { analyzeSentiment } from './sentiment';

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE = 'https://newsapi.org/v2';

// Prioritised sources – NewsAPI source IDs
const PRIORITY_SOURCES = [
  'reuters', 'bloomberg', 'financial-times', 'techcrunch', 'the-verge',
  'cnbc', 'the-wall-street-journal', 'business-insider', 'wired',
  'ars-technica', 'mit-technology-review',
];

// Source display name normalisation
const SOURCE_NAMES: Record<string, string> = {
  reuters: 'Reuters',
  bloomberg: 'Bloomberg',
  'financial-times': 'Financial Times',
  techcrunch: 'TechCrunch',
  'the-verge': 'The Verge',
  cnbc: 'CNBC',
  'the-wall-street-journal': 'WSJ',
  'business-insider': 'Business Insider',
  wired: 'Wired',
  'ars-technica': 'Ars Technica',
  'mit-technology-review': 'MIT Tech Review',
};

const SEARCH_QUERIES = [
  'AI layoffs artificial intelligence',
  'AI funding startup investment',
  'OpenAI Anthropic Google AI announcement',
  'artificial intelligence regulation',
  'AI product launch LLM',
  'AI disruption technology',
];

let usedIds: Set<string>;
function resetIds() {
  usedIds = new Set();
}

async function fetchNewsQuery(q: string, apiKey: string): Promise<NewsArticle[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const params = new URLSearchParams({
    q,
    language: 'en',
    sortBy: 'relevancy',
    from: since,
    pageSize: '30',
    apiKey,
  });

  const res = await fetch(`${NEWS_API_BASE}/everything?${params}`, {
    next: { revalidate: 0 },
  });

  if (res.status === 426) {
    // NewsAPI free tier limitation: requires HTTPS (always true in prod)
    console.warn('[News] NewsAPI plan limitation');
    return [];
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`NewsAPI error ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  return json.articles ?? [];
}

function scoreArticle(article: NewsArticle): number {
  let score = 50; // base
  const sourceId = article.source.id ?? '';
  if (PRIORITY_SOURCES.includes(sourceId)) score += 50;
  const textForCategory = `${article.title} ${article.description ?? ''}`;
  const category = detectCategory(textForCategory);
  if (category !== 'General') score += 20;
  return score;
}

export async function fetchNewsArticles(): Promise<FeedItem[]> {
  if (!NEWS_API_KEY) {
    console.warn('[News] NEWS_API_KEY not set – skipping');
    return [];
  }

  resetIds();
  const rawArticles: (NewsArticle & { _score: number })[] = [];

  for (const q of SEARCH_QUERIES) {
    try {
      const articles = await fetchNewsQuery(q, NEWS_API_KEY);
      for (const a of articles) {
        if (!isAiRelevant(`${a.title} ${a.description ?? ''}`)) continue;
        rawArticles.push({ ...a, _score: scoreArticle(a) });
      }
    } catch (err) {
      console.error(`[News] Query "${q.slice(0, 30)}" failed:`, (err as Error).message);
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  // Deduplicate before mapping to FeedItem
  const deduped = deduplicateItems(
    rawArticles.map((a) => ({ ...a, url: a.url, title: a.title }))
  ) as (NewsArticle & { _score: number })[];

  const items: FeedItem[] = deduped
    .sort((a, b) => b._score - a._score)
    .slice(0, 80)
    .map((article, i) => {
      const text = `${article.title} ${article.description ?? ''} ${article.content ?? ''}`;
      const sourceId = article.source.id ?? '';
      const sourceName =
        SOURCE_NAMES[sourceId] ?? article.source.name ?? 'News';

      return {
        id: `news_${Buffer.from(article.url).toString('base64url').slice(0, 16)}_${i}`,
        type: 'news' as const,
        title: article.title,
        content: article.description ?? article.content?.slice(0, 300) ?? '',
        author: article.author ?? sourceName,
        source: sourceName,
        url: article.url,
        imageUrl: article.urlToImage ?? undefined,
        engagementScore: article._score,
        likes: 0,
        reposts: 0,
        replies: 0,
        views: 0,
        category: detectCategory(text),
        sentiment: analyzeSentiment(text),
        tags: extractTags(text),
        publishedAt: article.publishedAt,
        createdAt: new Date().toISOString(),
      };
    });

  return items;
}
