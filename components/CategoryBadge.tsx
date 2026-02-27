'use client';

import type { Category } from '@/types';

const CONFIG: Record<Category, { label: string; classes: string }> = {
  Layoffs:         { label: 'Layoffs',        classes: 'bg-red-500/15 text-red-400 border-red-500/25' },
  Funding:         { label: 'Funding',         classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  'Product Launch':{ label: 'Product Launch',  classes: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  Regulation:      { label: 'Regulation',      classes: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  Breakthrough:    { label: 'Breakthrough',    classes: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
  Acquisition:     { label: 'Acquisition',     classes: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25' },
  General:         { label: 'AI',              classes: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
};

interface Props {
  category: Category;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'sm' }: Props) {
  const cfg = CONFIG[category] ?? CONFIG.General;
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-xs px-2 py-1';

  return (
    <span className={`inline-flex items-center rounded border font-medium uppercase tracking-wide ${sizeClasses} ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}
