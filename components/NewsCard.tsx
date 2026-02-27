'use client';

import { formatDistanceToNow } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import type { FeedItem } from '@/types';
import CategoryBadge from './CategoryBadge';
import SentimentBadge from './SentimentBadge';

interface Props {
  item: FeedItem;
}

export default function NewsCard({ item }: Props) {
  const timeAgo = formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true });

  return (
    <article className="group border-b border-rule last:border-b-0 py-4 first:pt-0">
      <div className="flex gap-3">
        {/* Text content */}
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-1.5">
            <CategoryBadge category={item.category} size="sm" />
            <SentimentBadge sentiment={item.sentiment} />
            <span className="text-[10px] text-ink-light font-sans uppercase tracking-wide ml-auto flex-shrink-0">
              {item.source}
            </span>
          </div>

          {/* Headline */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <h3 className="font-serif font-bold text-[15px] leading-snug text-ink mb-1 group-hover:text-wsj-red transition-colors line-clamp-2">
              {item.title}
            </h3>
          </a>

          {/* Excerpt */}
          {item.content && (
            <p className="text-[12px] text-ink-secondary font-sans leading-relaxed line-clamp-2 mb-2">
              {item.content}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-light font-sans italic">
              {item.author && item.author !== item.source ? item.author : ''}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-ink-faint font-sans">{timeAgo}</span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-faint hover:text-wsj-red transition-colors"
                aria-label="Read article"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Thumbnail image — right side like WSJ */}
        {item.imageUrl && (
          <div className="flex-shrink-0 w-20 h-16 overflow-hidden">
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
    </article>
  );
}
