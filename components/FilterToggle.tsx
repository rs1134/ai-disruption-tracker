'use client';

import type { FilterType } from '@/types';

interface Props {
  value: FilterType;
  onChange: (v: FilterType) => void;
  counts: { all: number; tweet: number; news: number };
}

const TABS: { id: FilterType; label: string }[] = [
  { id: 'all',   label: 'All Stories' },
  { id: 'tweet', label: 'Reddit & HN' },
  { id: 'news',  label: 'News' },
];

export default function FilterToggle({ value, onChange, counts }: Props) {
  return (
    <div className="flex items-center gap-2 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
      {TABS.map((tab) => {
        const active = value === tab.id;
        const count = counts[tab.id];
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
              transition-all duration-150 select-none whitespace-nowrap
              ${active
                ? 'bg-white text-slate-900 shadow-card'
                : 'text-slate-500 hover:text-slate-700'
              }
            `}
          >
            {tab.label}
            <span className={`
              text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
              ${active
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-slate-200 text-slate-400'
              }
            `}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
