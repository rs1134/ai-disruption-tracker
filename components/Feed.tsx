'use client';

import { useEffect, useRef, useState } from 'react';
import PostCard from './PostCard';
import NewsCard from './NewsCard';
import FilterToggle from './FilterToggle';
import type { FeedItem, FilterType } from '@/types';

interface Props {
  onCountsChange?: (counts: { all: number; tweet: number; news: number }) => void;
}

const PAGE_SIZE = 20;

export default function Feed({ onCountsChange }: Props) {
  const [allItems, setAllItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch all items on mount
  useEffect(() => {
    setLoading(true);
    fetch('/api/posts?limit=100')
      .then((r) => r.json())
      .then((res) => {
        const items: FeedItem[] = res.data ?? [];
        setAllItems(items);
        const counts = {
          all: items.length,
          tweet: items.filter((i) => i.type === 'tweet').length,
          news: items.filter((i) => i.type === 'news').length,
        };
        onCountsChange?.(counts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = allItems.filter((item) => filter === 'all' || item.type === filter);
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setPage((p) => p + 1);
            setLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [filter]);

  const counts = {
    all: allItems.length,
    tweet: allItems.filter((i) => i.type === 'tweet').length,
    news: allItems.filter((i) => i.type === 'news').length,
  };

  if (loading) {
    return (
      <div>
        {/* Skeleton filter tabs */}
        <div className="h-9 w-64 bg-rule animate-pulse mb-4" />
        {/* Skeleton cards */}
        <div className="divide-y divide-rule">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="py-4 space-y-2">
              <div className="h-3 w-16 bg-rule animate-pulse" />
              <div className="h-4 w-full bg-rule animate-pulse" />
              <div className="h-4 w-4/5 bg-rule animate-pulse" />
              <div className="h-3 w-32 bg-rule animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <FilterToggle value={filter} onChange={setFilter} counts={counts} />

      {visible.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[15px] text-ink-secondary font-serif mb-1">No items yet</p>
          <p className="text-[12px] text-ink-light font-sans">The first data refresh will populate this feed.</p>
        </div>
      ) : (
        <div className="divide-y divide-rule">
          {visible.map((item) =>
            item.type === 'tweet' ? (
              <PostCard key={item.id} item={item} />
            ) : (
              <NewsCard key={item.id} item={item} />
            )
          )}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loadingMore && (
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-ink-faint animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
