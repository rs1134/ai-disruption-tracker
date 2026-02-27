'use client';

import { MessageSquare, Newspaper, LayoutGrid } from 'lucide-react';
import type { FilterType } from '@/types';

interface Props {
  value: FilterType;
  onChange: (v: FilterType) => void;
  counts: { all: number; tweet: number; news: number };
}

const TABS: { id: FilterType; label: string; icon: React.ReactNode }[] = [
  { id: 'all',   label: 'All',           icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { id: 'tweet', label: 'Reddit & HN',   icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: 'news',  label: 'News',          icon: <Newspaper className="w-3.5 h-3.5" /> },
];

export default function FilterToggle({ value, onChange, counts }: Props) {
  return (
    <div className="flex items-center bg-surface-card border border-surface-border rounded-lg p-1 gap-1">
      {TABS.map((tab) => {
        const active = value === tab.id;
        const count = counts[tab.id];
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
              transition-all duration-150 select-none
              ${active
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50'
                : 'text-slate-400 hover:text-white hover:bg-surface-hover'
              }
            `}
          >
            {tab.icon}
            {tab.label}
            <span className={`
              text-[10px] px-1.5 py-0.5 rounded-full font-mono
              ${active ? 'bg-blue-500/40 text-blue-100' : 'bg-slate-700/60 text-slate-500'}
            `}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
