'use client';

import { formatDistanceToNow } from 'date-fns';
import { ArrowUp, MessageCircle, ExternalLink } from 'lucide-react';
import type { FeedItem, Category } from '@/types';
import CategoryBadge from './CategoryBadge';
import SentimentBadge from './SentimentBadge';

interface Props {
  item: FeedItem;
}

const GRADIENT_CLASS: Record<Category, string> = {
  Layoffs:          'gradient-layoffs',
  Funding:          'gradient-funding',
  'Product Launch': 'gradient-product',
  Regulation:       'gradient-regulation',
  Breakthrough:     'gradient-breakthrough',
  Acquisition:      'gradient-acquisition',
  General:          'gradient-general',
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function PostCard({ item }: Props) {
  const timeAgo = formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true });
  const gradientClass = GRADIENT_CLASS[item.category] ?? 'gradient-general';

  return (
    <article className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover border border-slate-100 article-card animate-fade-in flex flex-col">
      {/* Top image or gradient */}
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block relative aspect-video card-image-wrap">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title || item.source}
            className="w-full h-full object-cover card-gradient"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const parent = img.parentElement;
              if (parent) {
                const div = document.createElement('div');
                div.className = `w-full h-full ${gradientClass} card-gradient`;
                parent.appendChild(div);
              }
            }}
          />
        ) : (
          <div className={`w-full h-full ${gradientClass} card-gradient`} />
        )}

        {/* Category badge over image bottom-left */}
        <div className="absolute bottom-2.5 left-2.5">
          <CategoryBadge category={item.category} size="sm" />
        </div>

        {/* Sentiment dot top-right */}
        <div className="absolute top-2.5 right-2.5">
          <SentimentBadge sentiment={item.sentiment} />
        </div>
      </a>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Source label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">
            {item.source}
          </span>
          <span className="text-[11px] text-slate-400">{timeAgo}</span>
        </div>

        {/* Headline */}
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block flex-1">
          <h3 className="font-bold text-[15px] leading-snug text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors mb-2">
            {item.title || item.content}
          </h3>
        </a>

        {/* Excerpt */}
        {item.content && item.content !== item.title && (
          <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2 mb-3">
            {item.content}
          </p>
        )}

        {/* Footer: engagement + external link */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 text-[12px] text-slate-400">
            {item.likes > 0 && (
              <span className="flex items-center gap-1 hover:text-slate-600">
                <ArrowUp className="w-3 h-3" />
                {fmt(item.likes)}
              </span>
            )}
            {item.replies > 0 && (
              <span className="flex items-center gap-1 hover:text-slate-600">
                <MessageCircle className="w-3 h-3" />
                {fmt(item.replies)}
              </span>
            )}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            aria-label="Open post"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
