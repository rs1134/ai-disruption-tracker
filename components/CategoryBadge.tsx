'use client';

import type { Category } from '@/types';

const CONFIG: Record<Category, { label: string; bg: string; text: string }> = {
  Layoffs:          { label: 'Layoffs',        bg: 'bg-red-500',     text: 'text-white' },
  Funding:          { label: 'Funding',         bg: 'bg-emerald-500', text: 'text-white' },
  'Product Launch': { label: 'Product',         bg: 'bg-blue-500',    text: 'text-white' },
  Regulation:       { label: 'Regulation',      bg: 'bg-amber-500',   text: 'text-white' },
  Breakthrough:     { label: 'Breakthrough',    bg: 'bg-purple-500',  text: 'text-white' },
  Acquisition:      { label: 'Acquisition',     bg: 'bg-cyan-500',    text: 'text-white' },
  General:          { label: 'AI',              bg: 'bg-slate-500',   text: 'text-white' },
};

interface Props {
  category: Category;
  size?: 'sm' | 'md' | 'lg';
}

export default function CategoryBadge({ category, size = 'sm' }: Props) {
  const cfg = CONFIG[category] ?? CONFIG.General;

  const sizeClasses =
    size === 'lg' ? 'text-[11px] px-2.5 py-1 rounded-md' :
    size === 'md' ? 'text-[10px] px-2 py-0.5 rounded' :
                   'text-[9px] px-1.5 py-0.5 rounded';

  return (
    <span className={`inline-flex items-center font-bold tracking-wide uppercase ${sizeClasses} ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}
