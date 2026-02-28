import { fetchTwitterPosts } from './twitter';
import { fetchNewsArticles } from './news';
import {
  upsertFeedItem,
  upsertTrendingCompany,
  logFetch,
  cleanupExpired,
} from './db';
import { cache, CACHE_KEYS } from './cache';
import { extractMentionedCompanies } from './nlp';

export interface RefreshResults {
  tweets: number;
  news: number;
  errors: string[];
  durationMs: number;
}

/**
 * Shared refresh logic – fetches fresh social posts + news articles,
 * upserts them into the DB, and invalidates all in-process caches.
 *
 * Called by:
 *  - /api/cron/refresh  (Vercel cron, daily)
 *  - /api/admin/refresh (manual "Refresh Now" button)
 *  - /api/posts         (on-demand, when DB returns 0 live items)
 */
export async function refreshAllData(): Promise<RefreshResults> {
  const startTime = Date.now();
  const results: RefreshResults = { tweets: 0, news: 0, errors: [], durationMs: 0 };

  // 1. Clean up anything that has already expired
  try {
    await cleanupExpired();
  } catch (err) {
    console.error('[Refresh] Cleanup error:', err);
  }

  // 2. Social posts (Reddit + Hacker News)
  try {
    const tweets = await fetchTwitterPosts();
    for (const tweet of tweets) {
      try {
        await upsertFeedItem({
          id: tweet.id,
          type: tweet.type,
          title: tweet.title,
          content: tweet.content,
          author: tweet.author,
          source: tweet.source,
          url: tweet.url,
          imageUrl: tweet.imageUrl,
          engagementScore: tweet.engagementScore,
          likes: tweet.likes,
          reposts: tweet.reposts,
          replies: tweet.replies,
          views: tweet.views,
          category: tweet.category,
          sentiment: tweet.sentiment,
          tags: tweet.tags,
          publishedAt: tweet.publishedAt,
        });

        const companies = extractMentionedCompanies(tweet.content);
        for (const company of companies) {
          await upsertTrendingCompany(company, tweet.sentiment);
        }

        results.tweets++;
      } catch (err) {
        console.error('[Refresh] Tweet insert error:', err);
      }
    }
    await logFetch('social', 'success', results.tweets, undefined, Date.now() - startTime);
  } catch (err) {
    const msg = (err as Error).message;
    results.errors.push(`Social: ${msg}`);
    await logFetch('social', 'error', 0, msg, Date.now() - startTime);
  }

  // 3. News articles
  try {
    const articles = await fetchNewsArticles();
    for (const article of articles) {
      try {
        await upsertFeedItem({
          id: article.id,
          type: article.type,
          title: article.title,
          content: article.content,
          author: article.author,
          source: article.source,
          url: article.url,
          imageUrl: article.imageUrl,
          engagementScore: article.engagementScore,
          likes: 0,
          reposts: 0,
          replies: 0,
          views: 0,
          category: article.category,
          sentiment: article.sentiment,
          tags: article.tags,
          publishedAt: article.publishedAt,
        });

        const companies = extractMentionedCompanies(article.title + ' ' + article.content);
        for (const company of companies) {
          await upsertTrendingCompany(company, article.sentiment);
        }

        results.news++;
      } catch (err) {
        console.error('[Refresh] News insert error:', err);
      }
    }
    await logFetch('news', 'success', results.news, undefined, Date.now() - startTime);
  } catch (err) {
    const msg = (err as Error).message;
    results.errors.push(`News: ${msg}`);
    await logFetch('news', 'error', 0, msg, Date.now() - startTime);
  }

  // 4. Bust all in-process caches so the next request fetches fresh data
  cache.invalidatePrefix('feed:');
  cache.invalidate(CACHE_KEYS.TRENDING);
  cache.invalidate(CACHE_KEYS.SIDEBAR_STATS);
  cache.invalidate(CACHE_KEYS.ADMIN_STATS);
  cache.invalidate(CACHE_KEYS.TOP_DISRUPTION);
  cache.invalidate(CACHE_KEYS.KEYWORD_COUNTS);

  results.durationMs = Date.now() - startTime;
  console.log(
    `[Refresh] Done in ${results.durationMs}ms – tweets: ${results.tweets}, news: ${results.news}`
  );

  return results;
}
