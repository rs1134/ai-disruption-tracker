import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ai-disruption-tracker-nine.vercel.app'),
  title: {
    default: 'AI Disruption Tracker — Top AI News & Posts in the Last 24 Hours',
    template: '%s | AI Disruption Tracker',
  },
  description:
    'Real-time feed of the highest-engagement posts and breaking news about AI layoffs, funding rounds, product launches, regulations, and breakthroughs — updated daily.',
  keywords: [
    'AI disruption', 'AI news', 'AI layoffs', 'AI funding', 'OpenAI', 'Anthropic',
    'artificial intelligence', 'LLM', 'AGI', 'AI regulation', 'AI startups',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'AI Disruption Tracker',
    title: 'AI Disruption Tracker — Top AI News in the Last 24 Hours',
    description: 'Real-time AI disruption news and social posts updated daily.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Disruption Tracker',
    description: 'Real-time AI disruption news and social posts.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
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
              url: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ai-disruption-tracker-nine.vercel.app',
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
