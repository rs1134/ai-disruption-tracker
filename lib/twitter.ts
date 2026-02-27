import type { FeedItem, TwitterRawTweet, TwitterUser } from '@/types';
import { detectCategory, extractTags, isAiRelevant, deduplicateItems } from './nlp';
import { analyzeSentiment } from './sentiment';

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const TWITTER_API_BASE = 'https://api.twitter.com/2';

// Search queries – split across multiple requests to maximise coverage
// while staying within Twitter API v2 query length limits
const SEARCH_QUERIES = [
  '(AI layoff OR "AI layoffs" OR "laid off" AI) lang:en -is:retweet',
  '(AI funding OR "AI startup" OR "AI investment" OR "series" AI) lang:en -is:retweet',
  '(OpenAI OR Anthropic OR "Google AI" OR "Meta AI") lang:en -is:retweet',
  '("Microsoft AI" OR "AI disruption" OR "AI regulation" OR LLM) lang:en -is:retweet',
  '(AGI OR "AI product" OR "AI model" OR "AI launch") lang:en -is:retweet',
];

function calcEngagementScore(metrics: TwitterRawTweet['public_metrics']): number {
  return (
    metrics.like_count * 1 +
    metrics.retweet_count * 2 +
    metrics.reply_count * 1.5 +
    metrics.impression_count * 0.1
  );
}

async function fetchQuery(query: string, token: string): Promise<{
  tweets: TwitterRawTweet[];
  users: Map<string, TwitterUser>;
}> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    query,
    max_results: '100',
    start_time: since,
    'tweet.fields': 'created_at,public_metrics,author_id,entities',
    'user.fields': 'name,username,profile_image_url,public_metrics',
    expansions: 'author_id',
    sort_order: 'relevancy',
  });

  const res = await fetch(`${TWITTER_API_BASE}/tweets/search/recent?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 },
  });

  if (res.status === 429) {
    throw new Error('Twitter API rate limit reached');
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Twitter API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = await res.json();

  const users = new Map<string, TwitterUser>();
  for (const user of json.includes?.users ?? []) {
    users.set(user.id, user);
  }

  return {
    tweets: json.data ?? [],
    users,
  };
}

export async function fetchTwitterPosts(): Promise<FeedItem[]> {
  if (!TWITTER_BEARER_TOKEN) {
    console.warn('[Twitter] TWITTER_BEARER_TOKEN not set – skipping');
    return [];
  }

  const allItems: FeedItem[] = [];

  for (const query of SEARCH_QUERIES) {
    try {
      const { tweets, users } = await fetchQuery(query, TWITTER_BEARER_TOKEN);

      for (const tweet of tweets) {
        const fullText = tweet.text;
        if (!isAiRelevant(fullText)) continue;

        const user = users.get(tweet.author_id);
        const score = calcEngagementScore(tweet.public_metrics);

        const item: FeedItem = {
          id: `tw_${tweet.id}`,
          type: 'tweet',
          title: fullText.slice(0, 120) + (fullText.length > 120 ? '…' : ''),
          content: fullText,
          author: user ? `@${user.username}` : 'Unknown',
          source: user?.name ?? 'Twitter',
          url: `https://twitter.com/i/web/status/${tweet.id}`,
          imageUrl: user?.profile_image_url,
          engagementScore: Math.round(score * 10) / 10,
          likes: tweet.public_metrics.like_count,
          reposts: tweet.public_metrics.retweet_count,
          replies: tweet.public_metrics.reply_count,
          views: tweet.public_metrics.impression_count,
          category: detectCategory(fullText),
          sentiment: analyzeSentiment(fullText),
          tags: extractTags(fullText),
          publishedAt: tweet.created_at,
          createdAt: new Date().toISOString(),
        };

        allItems.push(item);
      }
    } catch (err) {
      console.error(`[Twitter] Query failed ("${query.slice(0, 40)}…"):`, (err as Error).message);
    }

    // Small delay to avoid burst rate-limiting
    await new Promise((r) => setTimeout(r, 250));
  }

  // Deduplicate and sort by score
  const unique = deduplicateItems(allItems);
  return unique.sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 100);
}
