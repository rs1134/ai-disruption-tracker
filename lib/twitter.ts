// ── Social Feed: Reddit + Hacker News ────────────────────────
// 100% free, no API key required.
// Exported as fetchTwitterPosts() for backward compatibility.

import type { FeedItem } from '@/types';
import { detectCategory, extractTags, isAiRelevant, deduplicateItems } from './nlp';
import { analyzeSentiment } from './sentiment';

const USER_AGENT =
  'AI-Disruption-Tracker/1.0 (https://github.com/rs1134/ai-disruption-tracker)';

const SUBREDDITS = [
  'MachineLearning',
  'artificial',
  'singularity',
  'LocalLLaMA',
  'OpenAI',
  'ChatGPT',
  'AINews',
  'Futurology',
  'technology',
];

// ── Reddit ────────────────────────────────────────────────────

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  author: string;
  subreddit: string;
  score: number;
  num_comments: number;
  upvote_ratio: number;
  created_utc: number;
  thumbnail: string;
  stickied: boolean;
}

async function fetchSubreddit(sub: string): Promise<FeedItem[]> {
  const since24h = Math.floor(Date.now() / 1000) - 86_400;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  let json: { data?: { children?: { data: RedditPost }[] } };
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${sub}/hot.json?limit=100`,
      {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
        next: { revalidate: 0 },
      }
    );
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    json = await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }

  const children = json.data?.children ?? [];

  return children
    .map((c) => c.data)
    .filter((p) => p.created_utc >= since24h && !p.stickied)
    .filter((p) => isAiRelevant(`${p.title} ${p.selftext ?? ''}`))
    .map((p): FeedItem => {
      const text = `${p.title} ${p.selftext ?? ''}`;
      const engScore = p.score * 1 + p.num_comments * 1.5;
      const estimatedViews = Math.round(p.score / Math.max(p.upvote_ratio, 0.1));

      return {
        id: `rd_${p.id}`,
        type: 'tweet',
        title: p.title.slice(0, 160),
        content: p.selftext?.slice(0, 500) || p.title,
        author: `u/${p.author}`,
        source: `r/${p.subreddit}`,
        url: `https://reddit.com${p.permalink}`,
        imageUrl: p.thumbnail?.startsWith('http') ? p.thumbnail : undefined,
        engagementScore: Math.round(engScore * 10) / 10,
        likes: p.score,
        reposts: 0,
        replies: p.num_comments,
        views: estimatedViews,
        category: detectCategory(text),
        sentiment: analyzeSentiment(text),
        tags: extractTags(text),
        publishedAt: new Date(p.created_utc * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };
    });
}

// ── Hacker News ───────────────────────────────────────────────

interface HNStory {
  id: number;
  type: string;
  title: string;
  url?: string;
  text?: string;
  by: string;
  time: number;
  score: number;
  descendants?: number;
  deleted?: boolean;
}

async function fetchHackerNews(): Promise<FeedItem[]> {
  const since24h = Date.now() - 86_400_000;

  const idsRes = await fetch(
    'https://hacker-news.firebaseio.com/v0/topstories.json',
    { next: { revalidate: 0 } }
  );
  if (!idsRes.ok) throw new Error(`HN topstories HTTP ${idsRes.status}`);
  const ids: number[] = await idsRes.json();

  const results: FeedItem[] = [];
  const BATCH = 20;
  const limit = Math.min(ids.length, 200);

  for (let i = 0; i < limit; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          next: { revalidate: 0 },
        }).then((r) => r.json() as Promise<HNStory>)
      )
    );

    for (const result of settled) {
      if (result.status !== 'fulfilled') continue;
      const s = result.value;
      if (!s || s.type !== 'story' || s.deleted) continue;
      if (s.time * 1000 < since24h) continue;
      if (!isAiRelevant(`${s.title} ${s.text ?? ''}`)) continue;

      const text = `${s.title} ${s.text ?? ''}`;
      const engScore = (s.score ?? 0) * 1 + (s.descendants ?? 0) * 1.5;

      results.push({
        id: `hn_${s.id}`,
        type: 'tweet',
        title: s.title,
        content: s.text ? s.text.replace(/<[^>]+>/g, '').slice(0, 400) : s.title,
        author: s.by ?? 'Anonymous',
        source: 'Hacker News',
        url: s.url ?? `https://news.ycombinator.com/item?id=${s.id}`,
        engagementScore: Math.round(engScore * 10) / 10,
        likes: s.score ?? 0,
        reposts: 0,
        replies: s.descendants ?? 0,
        views: 0,
        category: detectCategory(text),
        sentiment: analyzeSentiment(text),
        tags: extractTags(text),
        publishedAt: new Date(s.time * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    if (i + BATCH < limit) await new Promise((r) => setTimeout(r, 100));
  }

  return results;
}

// ── Main export ───────────────────────────────────────────────

export async function fetchTwitterPosts(): Promise<FeedItem[]> {
  const allItems: FeedItem[] = [];

  // Reddit subreddits – sequential with small delay
  for (const sub of SUBREDDITS) {
    try {
      const posts = await fetchSubreddit(sub);
      allItems.push(...posts);
      console.log(`[Reddit] r/${sub}: ${posts.length} relevant posts`);
    } catch (err) {
      console.error(`[Reddit] r/${sub} failed:`, (err as Error).message);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  // Hacker News
  try {
    const hnItems = await fetchHackerNews();
    allItems.push(...hnItems);
    console.log(`[HN] ${hnItems.length} relevant stories`);
  } catch (err) {
    console.error('[HN] Failed:', (err as Error).message);
  }

  const unique = deduplicateItems(allItems);
  return unique
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 100);
}
