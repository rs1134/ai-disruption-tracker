'use client';

import { Zap, ExternalLink } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-surface-card to-surface-card p-5 mb-6">
      {/* Glow accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" />

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Biggest Disruption Today
            </span>
            <CategoryBadge category={item.category} size="sm" />
            <SentimentBadge sentiment={item.sentiment} />
          </div>

          <h2 className="text-base font-semibold text-white leading-snug mb-1 line-clamp-2">
            {item.title}
          </h2>

          {item.content && item.content !== item.title && (
            <p className="text-sm text-slate-400 line-clamp-2 mb-2">
              {item.content}
            </p>
          )}

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="font-medium text-slate-400">{item.source}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}</span>
            {item.engagementScore > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-500">
                  {item.engagementScore.toLocaleString()} engagement
                </span>
              </>
            )}
          </div>
        </div>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 flex items-center justify-center text-amber-400 hover:text-amber-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
