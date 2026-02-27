'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
        <div className="mb-4">
          <div className="h-10 w-56 bg-surface-card border border-surface-border rounded-lg animate-pulse" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-surface-card border border-surface-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <FilterToggle value={filter} onChange={setFilter} counts={counts} />
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg mb-1">No items yet</p>
          <p className="text-sm">The first data refresh will populate this feed.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
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
            <div className="flex gap-1.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
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
