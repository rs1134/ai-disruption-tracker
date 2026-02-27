# AI Disruption Tracker

> Real-time feed of the highest-engagement X (Twitter) posts and breaking news articles about AI disruptions — layoffs, funding, product launches, regulations, and breakthroughs — updated every 30 minutes.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-green?logo=postgresql)

---

## Features

- **Real-time feed** – X posts scored by engagement (`likes×1 + reposts×2 + replies×1.5 + views×0.1`) and news articles from Reuters, Bloomberg, TechCrunch, The Verge, CNBC, and more
- **Auto-category tagging** – Layoffs · Funding · Product Launch · Regulation · Breakthrough · Acquisition
- **Sentiment analysis** – keyword-based positive / negative / neutral classification
- **Trending companies sidebar** – frequency-based, updated with each refresh
- **Keyword heatmap** – visualise which terms dominate the 24-hour window
- **Biggest Disruption Today** – highest-scoring non-General item
- **Auto-refresh indicator** – 30-minute countdown with manual trigger
- **Admin dashboard** – fetch logs, category/sentiment breakdown, source stats, manual refresh
- **Dark theme, responsive** – desktop + mobile
- **Vercel Cron** – `/api/cron/refresh` runs every hour automatically
- **24-hour TTL** – all items expire automatically; no manual cleanup needed

---

## Tech Stack

| Layer       | Technology                         |
|-------------|-------------------------------------|
| Framework   | Next.js 14 (App Router)             |
| Styling     | Tailwind CSS 3                      |
| Language    | TypeScript 5                        |
| Database    | PostgreSQL via Neon serverless      |
| Twitter     | Twitter API v2 (Bearer Token)       |
| News        | NewsAPI `v2/everything`             |
| Deployment  | Vercel (with Cron Jobs)             |
| Caching     | In-process memory cache (30 min TTL)|

---

## Project Structure

```
ai-disruption-tracker/
├── app/
│   ├── layout.tsx              # Root layout, SEO metadata
│   ├── page.tsx                # Homepage (client component)
│   ├── globals.css
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── admin/
│   │   └── page.tsx            # Admin dashboard page
│   └── api/
│       ├── cron/refresh/       # Vercel Cron / manual refresh endpoint
│       ├── posts/              # Serve feed items from DB
│       ├── trending/           # Trending companies + sidebar stats
│       ├── keywords/           # Keyword counts for heatmap
│       ├── top-disruption/     # Single top disruption item
│       └── admin/
│           ├── stats/          # Admin stats endpoint
│           └── refresh/        # Manual admin refresh trigger
├── components/
│   ├── Feed.tsx                # Main feed with infinite scroll
│   ├── PostCard.tsx            # Tweet card
│   ├── NewsCard.tsx            # News article card
│   ├── Sidebar.tsx             # Right sidebar
│   ├── FilterToggle.tsx        # All / X Posts / News toggle
│   ├── AutoRefreshIndicator.tsx
│   ├── DisruptionHighlight.tsx # "Biggest Disruption Today" banner
│   ├── KeywordHeatmap.tsx
│   ├── AdminDashboard.tsx
│   ├── Header.tsx
│   ├── CategoryBadge.tsx
│   └── SentimentBadge.tsx
├── lib/
│   ├── db.ts                   # Neon DB client + all DB helpers
│   ├── cache.ts                # In-process memory cache
│   ├── twitter.ts              # Twitter API v2 fetcher
│   ├── news.ts                 # NewsAPI fetcher
│   ├── nlp.ts                  # Category detection, tag extraction, dedup
│   └── sentiment.ts            # Keyword-based sentiment analysis
├── types/
│   └── index.ts                # Shared TypeScript types
├── database/
│   ├── schema.sql              # PostgreSQL DDL
│   └── migrate.js              # Migration runner
├── .env.local.example
├── vercel.json                 # Cron schedule + function config
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/your-username/ai-disruption-tracker
cd ai-disruption-tracker
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:

| Variable              | Where to get it                                       |
|-----------------------|-------------------------------------------------------|
| `DATABASE_URL`        | [neon.tech](https://neon.tech) – free tier available  |
| `TWITTER_BEARER_TOKEN`| [developer.twitter.com](https://developer.twitter.com)|
| `NEWS_API_KEY`        | [newsapi.org](https://newsapi.org) – free dev plan    |
| `CRON_SECRET`         | `openssl rand -hex 32`                                |
| `ADMIN_SECRET`        | `openssl rand -hex 32`                                |
| `NEXT_PUBLIC_BASE_URL`| Your Vercel URL after deploy                          |

### 3. Run database migrations

```bash
node database/migrate.js
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Seed initial data

Hit the refresh endpoint once to populate the database:

```bash
curl http://localhost:3000/api/cron/refresh
```

---

## Deployment (Vercel)

1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add all environment variables in **Settings → Environment Variables**.
4. Deploy – Vercel will:
   - Build the Next.js app
   - Register the cron job from `vercel.json` (runs `GET /api/cron/refresh` every hour)
5. After deploy, seed data manually once:
   ```
   https://your-app.vercel.app/api/cron/refresh
   ```

> **Note:** Vercel Cron Jobs require a **Pro** plan or higher.
> On the free Hobby plan, you can use an external cron service (cron-job.org, GitHub Actions) to call `/api/cron/refresh` with the `Authorization: Bearer <CRON_SECRET>` header.

---

## Database Schema

See [`database/schema.sql`](database/schema.sql) for the full DDL.

**Main tables:**

| Table                | Purpose                                    |
|----------------------|--------------------------------------------|
| `feed_items`         | Tweets and news articles (TTL 24h)         |
| `trending_companies` | Company mention frequency (TTL 24h)        |
| `fetch_logs`         | Audit log of every API fetch run           |

All items have an `expires_at` column set to `NOW() + 24 hours`. A cleanup function (`cleanup_expired_items()`) is called at the start of each cron run and removes stale rows.

---

## API Reference

| Endpoint                    | Method | Description                           | Auth          |
|-----------------------------|--------|---------------------------------------|---------------|
| `/api/cron/refresh`         | GET    | Fetch & store new data                | `CRON_SECRET` |
| `/api/posts?type=tweet`     | GET    | Get feed items (tweet/news/all)       | Public        |
| `/api/trending`             | GET    | Trending companies + sidebar stats    | Public        |
| `/api/keywords`             | GET    | Keyword counts for heatmap            | Public        |
| `/api/top-disruption`       | GET    | Single top disruption item            | Public        |
| `/api/admin/stats`          | GET    | Detailed stats for admin dashboard    | `ADMIN_SECRET`|
| `/api/admin/refresh`        | POST   | Trigger a manual refresh              | `ADMIN_SECRET`|

All public endpoints are cached in-process for 30 minutes.

---

## Rate Limit Strategy

- **Caching:** All DB reads are cached in-process for 30 min. No repeated DB calls on every page load.
- **Twitter API:** 5 search queries per refresh cycle, 250ms delay between requests, handles `429` gracefully.
- **NewsAPI:** 6 search queries per refresh cycle, 150ms delay, handles plan limitations gracefully.
- **Retry logic:** Both fetchers catch errors per-query and continue rather than failing the whole refresh.
- **ISR-ready:** API routes set `next: { revalidate: 0 }` for fetch calls, deferring caching to our own layer.

---

## Customisation

### Add more keywords
Edit `lib/twitter.ts` → `SEARCH_QUERIES` array.
Edit `lib/news.ts` → `SEARCH_QUERIES` array.

### Change refresh interval
Edit `vercel.json` → `schedule` (cron expression).
Edit `components/AutoRefreshIndicator.tsx` → `intervalMs` prop default in `app/page.tsx`.

### Add more news sources
Edit `lib/news.ts` → `PRIORITY_SOURCES` and `SOURCE_NAMES`.

### Change 24-hour TTL
Edit `lib/db.ts` → search for `INTERVAL '24 hours'` and adjust.

---

## Security Notes

- All API keys are server-side only (`TWITTER_BEARER_TOKEN`, `NEWS_API_KEY`, `DATABASE_URL`)
- `NEXT_PUBLIC_*` variables are safe to expose; no secrets use this prefix
- Cron endpoint is protected by `CRON_SECRET` (Bearer token in header)
- Admin endpoints are protected by `ADMIN_SECRET` (`x-admin-secret` header)
- All DB queries use parameterised queries via Neon's tagged template SQL
- Output is sanitised by React's JSX rendering (no `dangerouslySetInnerHTML` on user content)

---

## License

MIT
