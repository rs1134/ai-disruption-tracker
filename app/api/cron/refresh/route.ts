import { NextRequest, NextResponse } from 'next/server';
import { fetchTwitterPosts } from '@/lib/twitter';
import { fetchNewsArticles } from '@/lib/news';
import {
  upsertFeedItem,
  upsertTrendingCompany,
  logFetch,
  cleanupExpired,
} from '@/lib/db';
import { cache, CACHE_KEYS } from '@/lib/cache';
import { extractMentionedCompanies, extractLayoffNumbers, extractFundingAmount } from '@/lib/nlp';

// Vercel Cron / manual refresh handler
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Protect cron endpoint
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    tweets: 0,
    news: 0,
    errors: [] as string[],
  };

  // Cleanup expired items first
  try {
    await cleanupExpired();
  } catch (err) {
    console.error('[Cron] Cleanup error:', err);
  }

  // Fetch social posts (Reddit + Hacker News)
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

        // Track trending companies
        const companies = extractMentionedCompanies(tweet.content);
        for (const company of companies) {
          await upsertTrendingCompany(company, tweet.sentiment);
        }

        results.tweets++;
      } catch (err) {
        // Individual insert errors don't fail the whole run
        console.error('[Cron] Tweet insert error:', err);
      }
    }
    await logFetch('social', 'success', results.tweets, undefined, Date.now() - startTime);
  } catch (err) {
    const msg = (err as Error).message;
    results.errors.push(`Social: ${msg}`);
    await logFetch('social', 'error', 0, msg, Date.now() - startTime);
  }

  // Fetch News articles
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
        console.error('[Cron] News insert error:', err);
      }
    }
    await logFetch('news', 'success', results.news, undefined, Date.now() - startTime);
  } catch (err) {
    const msg = (err as Error).message;
    results.errors.push(`News: ${msg}`);
    await logFetch('news', 'error', 0, msg, Date.now() - startTime);
  }

  // Invalidate all caches so next request fetches fresh data
  cache.invalidatePrefix('feed:');
  cache.invalidate(CACHE_KEYS.TRENDING);
  cache.invalidate(CACHE_KEYS.SIDEBAR_STATS);
  cache.invalidate(CACHE_KEYS.ADMIN_STATS);
  cache.invalidate(CACHE_KEYS.TOP_DISRUPTION);
  cache.invalidate(CACHE_KEYS.KEYWORD_COUNTS);

  const duration = Date.now() - startTime;
  console.log(`[Cron] Refresh complete in ${duration}ms – tweets: ${results.tweets}, news: ${results.news}`);

  return NextResponse.json({
    success: true,
    duration,
    results,
    timestamp: new Date().toISOString(),
  });
}
