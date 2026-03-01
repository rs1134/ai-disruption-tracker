// ── News Feed: Free RSS Feeds + Google News RSS ───────────────
// 100% free, no API key required.
// Parses standard RSS 2.0 and Atom feeds without any npm packages.

import type { FeedItem } from '@/types';
import { detectCategory, extractTags, isAiRelevant, deduplicateItems } from './nlp';
import { analyzeSentiment } from './sentiment';

// ── RSS feed sources ──────────────────────────────────────────

const RSS_FEEDS: { url: string; source: string; priority: number }[] = [
  // Tech / AI focused
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch', priority: 90 },
  { url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', source: 'The Verge', priority: 85 },
  { url: 'https://www.wired.com/feed/tag/ai/latest/rss', source: 'Wired', priority: 85 },
  { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', source: 'Ars Technica', priority: 80 },
  { url: 'https://www.technologyreview.com/feed/', source: 'MIT Tech Review', priority: 90 },
  { url: 'https://venturebeat.com/category/ai/feed/', source: 'VentureBeat', priority: 80 },
  // Google News keyword searches (free, no key)
  { url: 'https://news.google.com/rss/search?q=artificial+intelligence+layoffs&hl=en-US&gl=US&ceid=US:en', source: 'Google News', priority: 70 },
  { url: 'https://news.google.com/rss/search?q=AI+startup+funding&hl=en-US&gl=US&ceid=US:en', source: 'Google News', priority: 70 },
  { url: 'https://news.google.com/rss/search?q=OpenAI+OR+Anthropic+OR+%22Google+AI%22&hl=en-US&gl=US&ceid=US:en', source: 'Google News', priority: 75 },
  { url: 'https://news.google.com/rss/search?q=AI+regulation+OR+%22AI+act%22&hl=en-US&gl=US&ceid=US:en', source: 'Google News', priority: 70 },
  { url: 'https://news.google.com/rss/search?q=LLM+OR+AGI+OR+%22large+language+model%22&hl=en-US&gl=US&ceid=US:en', source: 'Google News', priority: 70 },
];

// ── Minimal RSS / Atom parser (no external deps) ──────────────

function extractCdata(raw: string): string {
  const m = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1].trim() : raw.replace(/<[^>]+>/g, '').trim();
}

function getTag(xml: string, tag: string): string {
  // CDATA variant
  const cdataRe = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    'i'
  );
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();

  // Normal variant
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

function getAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

// Get raw (un-stripped) content for image extraction before HTML is removed
function getRawTag(xml: string, tag: string): string {
  const cdataRe = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    'i'
  );
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1];

  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

// Extract the first usable http(s) image URL from a blob of HTML
function extractImageFromHtml(html: string): string | undefined {
  // <img src="..."> or <img src='...'>
  const imgRe = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html)) !== null) {
    const src = m[1].trim();
    // Only accept absolute http(s) URLs and skip tiny tracking pixels / spacers
    if (
      src.startsWith('http') &&
      !src.includes('spacer') &&
      !src.includes('pixel') &&
      !src.includes('tracking') &&
      !src.endsWith('.gif')
    ) {
      return src;
    }
  }
  return undefined;
}

interface ParsedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author: string;
  imageUrl?: string;
}

function parseItem(itemXml: string): ParsedItem | null {
  const title = getTag(itemXml, 'title');

  // <link> can be plain text (RSS) or self-closing with href attr (Atom)
  const linkAttr = getAttr(itemXml, 'link', 'href');
  const linkTag = getTag(itemXml, 'link');
  const link = linkAttr || linkTag;

  if (!title || !link) return null;

  const description =
    getTag(itemXml, 'description') ||
    getTag(itemXml, 'summary') ||
    getTag(itemXml, 'content');

  const pubDate =
    getTag(itemXml, 'pubDate') ||
    getTag(itemXml, 'published') ||
    getTag(itemXml, 'updated') ||
    new Date().toISOString();

  const author =
    getTag(itemXml, 'author') ||
    getTag(itemXml, 'dc:creator') ||
    getTag(itemXml, 'name');

  // Media / enclosure image (standard RSS media tags)
  let imageUrl: string | undefined =
    getAttr(itemXml, 'media:content', 'url') ||
    getAttr(itemXml, 'media:thumbnail', 'url') ||
    getAttr(itemXml, 'enclosure', 'url') ||
    undefined;

  // Fallback: extract first <img> from description / content:encoded HTML
  // (many feeds embed article images in CDATA HTML blobs)
  if (!imageUrl) {
    const rawHtml =
      getRawTag(itemXml, 'content:encoded') ||
      getRawTag(itemXml, 'description') ||
      getRawTag(itemXml, 'summary');
    imageUrl = extractImageFromHtml(rawHtml);
  }

  // Decode common HTML entities
  const decode = (s: string) =>
    s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");

  return {
    title: decode(title),
    link: decode(link),
    description: decode(description).slice(0, 600),
    pubDate,
    author: decode(author),
    imageUrl,
  };
}

function parseFeed(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];

  // RSS 2.0 <item>
  const itemRe = /<item[\s>][\s\S]*?<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const parsed = parseItem(m[0]);
    if (parsed) items.push(parsed);
  }

  // Atom <entry>
  if (items.length === 0) {
    const entryRe = /<entry[\s>][\s\S]*?<\/entry>/gi;
    while ((m = entryRe.exec(xml)) !== null) {
      const parsed = parseItem(m[0]);
      if (parsed) items.push(parsed);
    }
  }

  return items;
}

// ── Fetch single feed ─────────────────────────────────────────

async function fetchFeed(
  feedUrl: string,
  sourceName: string,
  priority: number
): Promise<FeedItem[]> {
  const since24h = Date.now() - 86_400_000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  let xml: string;
  try {
    const res = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'AI-Disruption-Tracker/1.0',
        Accept: 'application/rss+xml, application/atom+xml, text/xml, */*',
      },
      signal: controller.signal,
      next: { revalidate: 0 },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    xml = await res.text();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }

  const rawItems = parseFeed(xml);
  const items: FeedItem[] = [];

  for (const raw of rawItems) {
    // Date filter
    const pub = new Date(raw.pubDate).getTime();
    if (isNaN(pub) || pub < since24h) continue;

    const text = `${raw.title} ${raw.description}`;
    if (!isAiRelevant(text)) continue;

    const category = detectCategory(text);
    const sentiment = analyzeSentiment(text);

    // Score: priority + category bonus
    const categoryBonus = category !== 'General' ? 20 : 0;
    const engagementScore = priority + categoryBonus;

    // Stable ID from URL
    const urlHash = Buffer.from(raw.link).toString('base64url').slice(0, 20);

    items.push({
      id: `rss_${urlHash}`,
      type: 'news',
      title: raw.title,
      content: raw.description,
      author: raw.author || sourceName,
      source: sourceName,
      url: raw.link,
      imageUrl: raw.imageUrl,
      engagementScore,
      likes: 0,
      reposts: 0,
      replies: 0,
      views: 0,
      category,
      sentiment,
      tags: extractTags(text),
      publishedAt: new Date(raw.pubDate).toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  return items;
}

// ── Main export ───────────────────────────────────────────────

export async function fetchNewsArticles(): Promise<FeedItem[]> {
  const allItems: FeedItem[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const items = await fetchFeed(feed.url, feed.source, feed.priority);
      allItems.push(...items);
      console.log(`[RSS] ${feed.source}: ${items.length} relevant articles`);
    } catch (err) {
      console.error(`[RSS] ${feed.source} failed:`, (err as Error).message);
    }
    // Small pause between requests
    await new Promise((r) => setTimeout(r, 150));
  }

  const unique = deduplicateItems(allItems);
  return unique
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 80);
}
