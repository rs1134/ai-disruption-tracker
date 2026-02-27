'use client';

import { formatDistanceToNow } from 'date-fns';
import { ArrowUp, MessageCircle, ExternalLink } from 'lucide-react';
import type { FeedItem } from '@/types';
import CategoryBadge from './CategoryBadge';
import SentimentBadge from './SentimentBadge';

interface Props {
  item: FeedItem;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function PostCard({ item }: Props) {
  const timeAgo = formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true });

  return (
    <article className="group border-b border-rule last:border-b-0 py-4 first:pt-0">
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
          {item.title || item.content}
        </h3>
      </a>

      {/* Excerpt */}
      {item.content && item.content !== item.title && (
        <p className="text-[12px] text-ink-secondary font-sans leading-relaxed line-clamp-2 mb-2">
          {item.content}
        </p>
      )}

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] text-ink-light font-sans">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-ink-light font-sans">
          {item.author && item.author !== item.source && (
            <span className="italic">{item.author}</span>
          )}
          {item.likes > 0 && (
            <span className="flex items-center gap-0.5">
              <ArrowUp className="w-2.5 h-2.5" />{fmt(item.likes)}
            </span>
          )}
          {item.replies > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageCircle className="w-2.5 h-2.5" />{fmt(item.replies)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-faint font-sans">{timeAgo}</span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-faint hover:text-wsj-red transition-colors"
            aria-label="Open post"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
