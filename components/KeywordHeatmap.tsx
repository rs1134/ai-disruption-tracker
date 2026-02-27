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
      <div className="space-y-1.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-5 bg-slate-800/60 rounded animate-pulse" style={{ width: `${60 + i * 5}%` }} />
        ))}
      </div>
    );
  }

  if (keywords.length === 0) {
    return <p className="text-xs text-slate-500">No keyword data yet.</p>;
  }

  const max = Math.max(...keywords.map((k) => k.count), 1);

  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.slice(0, 24).map((kw) => {
        const intensity = kw.count / max;
        const opacity = 0.2 + intensity * 0.75;
        const fontSize = 10 + intensity * 6;

        return (
          <span
            key={kw.keyword}
            title={`${kw.keyword}: ${kw.count} mentions`}
            className="cursor-default transition-transform hover:scale-110"
            style={{
              fontSize: `${fontSize}px`,
              color: `rgba(59, 130, 246, ${opacity})`,
              fontWeight: intensity > 0.6 ? 700 : 500,
              lineHeight: 1.4,
            }}
          >
            {kw.keyword}
          </span>
        );
      })}
    </div>
  );
}
