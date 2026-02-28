'use client';

import { useEffect, useState } from 'react';

interface KeywordData {
  keyword: string;
  count: number;
}

export default function KeywordHeatmap() {
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/keywords')
      .then((r) => r.json())
      .then((res) => {
        setKeywords(res.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="h-6 bg-slate-200 rounded-full animate-pulse"
            style={{ width: `${40 + i * 10}px` }}
          />
        ))}
      </div>
    );
  }

  if (keywords.length === 0) {
    return <p className="text-[12px] text-slate-400">No keyword data yet.</p>;
  }

  const max = Math.max(...keywords.map((k) => k.count), 1);

  return (
    <div className="flex flex-wrap gap-2">
      {keywords.slice(0, 20).map((kw) => {
        const intensity = kw.count / max;
        const fontSize = 10 + intensity * 4;
        // From light indigo to deep indigo based on intensity
        const bg = intensity > 0.6
          ? 'bg-indigo-500 text-white'
          : intensity > 0.3
            ? 'bg-indigo-100 text-indigo-700'
            : 'bg-slate-100 text-slate-500';

        return (
          <span
            key={kw.keyword}
            title={`${kw.keyword}: ${kw.count} mentions`}
            className={`px-2.5 py-1 rounded-full font-medium cursor-default transition-all hover:scale-105 ${bg}`}
            style={{ fontSize: `${fontSize}px` }}
          >
            {kw.keyword}
          </span>
        );
      })}
    </div>
  );
}
