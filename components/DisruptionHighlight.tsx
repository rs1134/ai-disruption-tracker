'use client';

import { ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { FeedItem } from '@/types';
import CategoryBadge from './CategoryBadge';
import SentimentBadge from './SentimentBadge';

interface Props {
  item: FeedItem | null;
}

export default function DisruptionHighlight({ item }: Props) {
  if (!item) return null;

  return (
    <div className="mb-6 border border-rule bg-paper-warm">
      {/* WSJ-style red top rule + label */}
      <div className="h-[3px] bg-wsj-red" />
      <div className="px-4 pt-3 pb-4">
        {/* Section label */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-wsj-red">
            Biggest Disruption Today
          </span>
          <CategoryBadge category={item.category} size="sm" />
          <SentimentBadge sentiment={item.sentiment} />
        </div>

        {/* Layout: text + optional image */}
        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <h2 className="font-serif font-bold text-xl sm:text-2xl leading-tight text-ink mb-2 group-hover:text-wsj-red transition-colors line-clamp-3">
                {item.title}
              </h2>
            </a>

            {item.content && item.content !== item.title && (
              <p className="text-[13px] text-ink-secondary font-sans leading-relaxed line-clamp-2 mb-3">
                {item.content}
              </p>
            )}

            <div className="flex items-center gap-3 text-[11px] text-ink-light font-sans">
              <span className="font-semibold text-ink-secondary">{item.source}</span>
              <span className="text-rule">|</span>
              <span>{formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}</span>
              {item.engagementScore > 0 && (
                <>
                  <span className="text-rule">|</span>
                  <span className="text-wsj-red font-semibold">
                    {item.engagementScore.toLocaleString()} pts
                  </span>
                </>
              )}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-ink-faint hover:text-wsj-red transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {item.imageUrl && (
            <div className="flex-shrink-0 w-28 sm:w-36 h-24 sm:h-28 overflow-hidden hidden sm:block">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
