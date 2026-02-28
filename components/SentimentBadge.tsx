'use client';

import type { Sentiment } from '@/types';

const CONFIG: Record<Sentiment, { dot: string; label: string }> = {
  positive: { dot: 'bg-emerald-500', label: 'Positive' },
  negative: { dot: 'bg-red-500',     label: 'Negative' },
  neutral:  { dot: 'bg-slate-400',   label: 'Neutral'  },
};

interface Props {
  sentiment: Sentiment;
}

export default function SentimentBadge({ sentiment }: Props) {
  const cfg = CONFIG[sentiment];
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}
      title={cfg.label}
    />
  );
}
