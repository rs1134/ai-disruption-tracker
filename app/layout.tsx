import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ai-disruption-tracker.vercel.app'),
  title: {
    default: 'AI Disruption Tracker – Top AI News & Posts in the Last 24 Hours',
    template: '%s | AI Disruption Tracker',
  },
  description:
    'Real-time feed of the highest-engagement X posts and breaking news about AI layoffs, funding rounds, product launches, regulations, and breakthroughs – updated every 30 minutes.',
  keywords: [
    'AI disruption', 'AI news', 'AI layoffs', 'AI funding', 'OpenAI', 'Anthropic',
    'artificial intelligence', 'LLM', 'AGI', 'AI regulation', 'AI startups',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'AI Disruption Tracker',
    title: 'AI Disruption Tracker – Top AI News & Posts in the Last 24 Hours',
    description: 'Real-time feed of the highest-engagement AI posts and breaking news updated every 30 minutes.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Disruption Tracker',
    description: 'Real-time AI disruption news and social posts.',
    creator: '@aidisruption',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'AI Disruption Tracker',
              description: 'Real-time AI disruption news tracker',
              url: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ai-disruption-tracker.vercel.app',
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-surface text-slate-100">
        {children}
      </body>
    </html>
  );
}
