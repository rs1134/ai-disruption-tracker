'use client';

import { ArrowRight, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { FeedItem, Category } from '@/types';
import CategoryBadge from './CategoryBadge';

// Category gradient CSS class mapping
const GRADIENT_CLASS: Record<Category, string> = {
  Layoffs:          'gradient-layoffs',
  Funding:          'gradient-funding',
  'Product Launch': 'gradient-product',
  Regulation:       'gradient-regulation',
  Breakthrough:     'gradient-breakthrough',
  Acquisition:      'gradient-acquisition',
  General:          'gradient-general',
};

// Category accent color for CTA button
const CTA_COLOR: Record<Category, string> = {
  Layoffs:          'bg-red-500 hover:bg-red-600',
  Funding:          'bg-emerald-500 hover:bg-emerald-600',
  'Product Launch': 'bg-blue-500 hover:bg-blue-600',
  Regulation:       'bg-amber-500 hover:bg-amber-600',
  Breakthrough:     'bg-purple-500 hover:bg-purple-600',
  Acquisition:      'bg-cyan-500 hover:bg-cyan-600',
  General:          'bg-slate-600 hover:bg-slate-700',
};

interface Props {
  item: FeedItem | null;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function DisruptionHighlight({ item }: Props) {
  if (!item) return null;

  const gradientClass = GRADIENT_CLASS[item.category] ?? 'gradient-general';
  const ctaColor = CTA_COLOR[item.category] ?? 'bg-slate-600 hover:bg-slate-700';
  const timeAgo = formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true });

  return (
    <div className="mb-8 rounded-2xl overflow-hidden shadow-hero bg-white border border-slate-100 article-card">
      {/* Hero image or gradient */}
      <div className="relative aspect-video sm:aspect-[21/9] card-image-wrap">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover card-gradient"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const parent = img.parentElement;
              if (parent) {
                const div = document.createElement('div');
                div.className = `w-full h-full ${gradientClass} card-gradient`;
                parent.insertBefore(div, img);
              }
            }}
          />
        ) : (
          <div className={`w-full h-full ${gradientClass} card-gradient`} />
        )}

        {/* Overlay gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Badges overlaid on image */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[11px] font-bold tracking-wide uppercase">
            <Flame className="w-3 h-3 text-amber-300" />
            Featured Story
          </span>
          <CategoryBadge category={item.category} size="md" />
        </div>

        {/* Source badge bottom right */}
        <div className="absolute bottom-4 right-4">
          <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/80 text-[10px] font-medium">
            {item.source}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block group">
          <h2 className="font-bold text-2xl sm:text-3xl leading-tight text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-3">
            {item.title}
          </h2>
        </a>

        {item.content && item.content !== item.title && (
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed line-clamp-3 mb-5">
            {item.content}
          </p>
        )}

        {/* Footer row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[12px] text-slate-400">
            <span className="font-semibold text-slate-600">{item.source}</span>
            <span>·</span>
            <span>{timeAgo}</span>
            {item.engagementScore > 0 && (
              <>
                <span>·</span>
                <span className="text-amber-500 font-semibold">
                  {fmt(item.engagementScore)} engagement
                </span>
              </>
            )}
          </div>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${ctaColor}`}
          >
            Read Full Story
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
