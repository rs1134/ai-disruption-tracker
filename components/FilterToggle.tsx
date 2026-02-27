'use client';

import type { FilterType } from '@/types';

interface Props {
  value: FilterType;
  onChange: (v: FilterType) => void;
  counts: { all: number; tweet: number; news: number };
}

const TABS: { id: FilterType; label: string }[] = [
  { id: 'all',   label: 'All' },
  { id: 'tweet', label: 'Reddit & HN' },
  { id: 'news',  label: 'News' },
];

export default function FilterToggle({ value, onChange, counts }: Props) {
  return (
    <div className="flex items-center border-b border-rule mb-1">
      {TABS.map((tab) => {
        const active = value === tab.id;
        const count = counts[tab.id];
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative flex items-center gap-1.5 px-4 py-2 text-[12px] font-sans font-semibold
              uppercase tracking-[0.08em] select-none transition-colors whitespace-nowrap
              ${active
                ? 'text-ink border-b-2 border-wsj-red -mb-px'
                : 'text-ink-light hover:text-ink-secondary border-b-2 border-transparent -mb-px'
              }
            `}
          >
            {tab.label}
            <span className={`
              text-[9px] font-mono px-1 py-px border
              ${active
                ? 'border-ink-secondary text-ink-secondary bg-paper-muted'
                : 'border-rule text-ink-light bg-transparent'
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
