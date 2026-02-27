import type { Sentiment } from '@/types';

// Keyword-based sentiment analysis – no external dependencies.
// Accurate enough for headline-level classification.

const POSITIVE_WORDS = [
  'breakthrough', 'launches', 'launch', 'fund', 'raises', 'raised', 'invest',
  'growth', 'revenue', 'profit', 'success', 'win', 'wins', 'milestone',
  'achieve', 'achieves', 'surpass', 'record', 'innovative', 'revolutionary',
  'exciting', 'impressive', 'amazing', 'great', 'best', 'leading', 'advance',
  'accelerate', 'partnership', 'collaboration', 'approved', 'approve',
  'positive', 'opportunity', 'expand', 'expansion', 'hire', 'hiring',
  'growing', 'profitable', 'unicorn', 'ipo', 'series', 'billion',
];

const NEGATIVE_WORDS = [
  'layoff', 'layoffs', 'fired', 'cut', 'cuts', 'reduce', 'reduction',
  'decline', 'drop', 'fall', 'lose', 'loss', 'losses', 'crisis', 'concern',
  'problem', 'issue', 'failure', 'fail', 'ban', 'banned', 'lawsuit',
  'fine', 'probe', 'investigation', 'fraud', 'danger', 'risk', 'threat',
  'harmful', 'bias', 'discrimination', 'hack', 'breach', 'leak', 'scam',
  'controversy', 'backlash', 'criticism', 'criticize', 'shutdown', 'close',
  'bankrupt', 'crash', 'warning', 'downgrade', 'worse', 'worst', 'delayed',
  'cancelled', 'cancel', 'halted', 'halt', 'suspended', 'suspension',
  'resignation', 'resign', 'quit', 'leaving', 'departure', 'controversy',
];

const NEUTRAL_BOOSTERS = [
  'report', 'reports', 'says', 'according', 'reveal', 'reveals', 'shows',
  'study', 'research', 'analysis', 'data', 'survey',
];

export function analyzeSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  const words = lower.split(/\W+/).filter(Boolean);

  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of words) {
    if (POSITIVE_WORDS.includes(word)) positiveScore++;
    if (NEGATIVE_WORDS.includes(word)) negativeScore++;
    // Negation handling
    if (word === 'not' || word === 'no' || word === "n't") {
      positiveScore = Math.max(0, positiveScore - 0.5);
      negativeScore = Math.max(0, negativeScore - 0.5);
    }
  }

  const diff = positiveScore - negativeScore;

  if (diff >= 1.5) return 'positive';
  if (diff <= -1) return 'negative';
  return 'neutral';
}

export function getSentimentColor(sentiment: Sentiment): string {
  switch (sentiment) {
    case 'positive': return 'text-emerald-400';
    case 'negative': return 'text-red-400';
    default:         return 'text-slate-400';
  }
}

export function getSentimentBg(sentiment: Sentiment): string {
  switch (sentiment) {
    case 'positive': return 'bg-emerald-500/10 border-emerald-500/20';
    case 'negative': return 'bg-red-500/10 border-red-500/20';
    default:         return 'bg-slate-500/10 border-slate-500/20';
  }
}

export function getSentimentLabel(sentiment: Sentiment): string {
  switch (sentiment) {
    case 'positive': return '↑ Positive';
    case 'negative': return '↓ Negative';
    default:         return '→ Neutral';
  }
}
