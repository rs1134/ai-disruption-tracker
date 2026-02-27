'use client';

import { formatDistanceToNow } from 'date-fns';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';
import type { FeedItem } from '@/types';
import CategoryBadge from './CategoryBadge';
import SentimentBadge from './SentimentBadge';

interface Props {
  item: FeedItem;
}

export default function NewsCard({ item }: Props) {
  const timeAgo = formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true });

  return (
    <article className="group relative bg-surface-card border border-surface-border rounded-xl overflow-hidden hover:border-purple-500/40 hover:bg-surface-hover transition-all duration-200 animate-fade-in">
      {/* Cover image */}
      {item.imageUrl && (
        <div className="relative h-36 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-card to-transparent" />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
              <Newspaper className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
              {item.source}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CategoryBadge category={item.category} />
            <SentimentBadge sentiment={item.sentiment} />
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-purple-400 transition-colors"
              aria-label="Read article"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white leading-snug mb-1.5 line-clamp-2 group-hover:text-purple-200 transition-colors">
          {item.title}
        </h3>

        {/* Description */}
        {item.content && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
            {item.content}
          </p>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="truncate max-w-[140px]">
            {item.author !== item.source ? item.author : ''}
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3" /> {timeAgo}
          </span>
        </div>
      </div>
    </article>
  );
}
