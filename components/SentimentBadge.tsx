'use client';

import type { Sentiment } from '@/types';

const CONFIG: Record<Sentiment, { label: string; classes: string }> = {
  positive: { label: '↑ Positive', classes: 'text-emerald-400' },
  negative: { label: '↓ Negative', classes: 'text-red-400' },
  neutral:  { label: '→ Neutral',  classes: 'text-slate-500' },
};

interface Props {
  sentiment: Sentiment;
}

export default function SentimentBadge({ sentiment }: Props) {
  const cfg = CONFIG[sentiment];
  return (
    <span className={`text-[10px] font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}
