'use client';

import type { Category } from '@/types';

// WSJ-style: bordered label tags, no background fill
const CONFIG: Record<Category, { label: string; borderColor: string; textColor: string }> = {
  Layoffs:          { label: 'LAYOFFS',        borderColor: 'border-red-600',    textColor: 'text-red-700' },
  Funding:          { label: 'FUNDING',         borderColor: 'border-emerald-700', textColor: 'text-emerald-700' },
  'Product Launch': { label: 'PRODUCT',         borderColor: 'border-blue-700',   textColor: 'text-blue-700' },
  Regulation:       { label: 'REGULATION',      borderColor: 'border-amber-700',  textColor: 'text-amber-700' },
  Breakthrough:     { label: 'BREAKTHROUGH',    borderColor: 'border-purple-700', textColor: 'text-purple-700' },
  Acquisition:      { label: 'ACQUISITION',     borderColor: 'border-cyan-700',   textColor: 'text-cyan-700' },
  General:          { label: 'AI',              borderColor: 'border-ink-muted',  textColor: 'text-ink-muted' },
};

interface Props {
  category: Category;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'sm' }: Props) {
  const cfg = CONFIG[category] ?? CONFIG.General;
  const sizeClasses = size === 'sm'
    ? 'text-[9px] px-1 py-px'
    : 'text-[10px] px-1.5 py-0.5';

  return (
    <span
      className={`
        inline-flex items-center border font-sans font-bold tracking-[0.1em] uppercase
        bg-transparent
        ${sizeClasses} ${cfg.borderColor} ${cfg.textColor}
      `}
    >
      {cfg.label}
    </span>
  );
}
