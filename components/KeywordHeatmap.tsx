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
          <div
            key={i}
            className="h-4 bg-rule animate-pulse"
            style={{ width: `${50 + i * 8}%` }}
          />
        ))}
      </div>
    );
  }

  if (keywords.length === 0) {
    return <p className="text-[11px] text-ink-light font-sans">No keyword data yet.</p>;
  }

  const max = Math.max(...keywords.map((k) => k.count), 1);

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1">
      {keywords.slice(0, 24).map((kw) => {
        const intensity = kw.count / max;
        const fontSize = 10 + intensity * 5;
        // Use ink color with varying opacity — editorial look
        const opacity = 0.35 + intensity * 0.65;

        return (
          <span
            key={kw.keyword}
            title={`${kw.keyword}: ${kw.count} mentions`}
            className="cursor-default font-sans transition-colors hover:text-wsj-red"
            style={{
              fontSize: `${fontSize}px`,
              color: `rgba(17, 17, 17, ${opacity})`,
              fontWeight: intensity > 0.5 ? 600 : 400,
              lineHeight: 1.6,
            }}
          >
            {kw.keyword}
          </span>
        );
      })}
    </div>
  );
}
