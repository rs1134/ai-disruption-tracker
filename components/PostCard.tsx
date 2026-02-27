'use client';

import { formatDistanceToNow } from 'date-fns';
import { Heart, Repeat2, MessageCircle, Eye, ExternalLink, MessageSquare } from 'lucide-react';
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
    <article className="group relative bg-surface-card border border-surface-border rounded-xl p-4 hover:border-blue-500/40 hover:bg-surface-hover transition-all duration-200 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.author}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-surface-border"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-blue-400" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-sm font-medium text-white truncate block">
              {item.source}
            </span>
            <span className="text-[11px] text-slate-500">{item.author}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <CategoryBadge category={item.category} />
            <SentimentBadge sentiment={item.sentiment} />
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-blue-400 transition-colors"
            aria-label="Open post"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-slate-300 leading-relaxed mb-3 line-clamp-3">
        {item.content}
      </p>

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

      {/* Metrics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          {item.likes > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" /> {fmt(item.likes)}
            </span>
          )}
          {item.reposts > 0 && (
            <span className="flex items-center gap-1">
              <Repeat2 className="w-3 h-3" /> {fmt(item.reposts)}
            </span>
          )}
          {item.replies > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" /> {fmt(item.replies)}
            </span>
          )}
          {item.views > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {fmt(item.views)}
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-600">{timeAgo}</span>
      </div>

      {/* Engagement score accent */}
      {item.engagementScore > 10000 && (
        <div className="absolute top-0 right-0 w-1 h-full rounded-r-xl bg-gradient-to-b from-blue-500/60 to-blue-500/10" />
      )}
    </article>
  );
}
