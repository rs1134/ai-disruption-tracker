'use client';

import type { Sentiment } from '@/types';

const CONFIG: Record<Sentiment, { label: string; classes: string }> = {
  positive: { label: '▲', classes: 'text-emerald-700' },
  negative: { label: '▼', classes: 'text-red-700' },
  neutral:  { label: '◆', classes: 'text-ink-light' },
};

interface Props {
  sentiment: Sentiment;
}

export default function SentimentBadge({ sentiment }: Props) {
  const cfg = CONFIG[sentiment];
  return (
    <span className={`text-[9px] font-bold leading-none ${cfg.classes}`} title={sentiment}>
      {cfg.label}
    </span>
  );
}
