'use client';

import { useEffect, useRef, useState } from 'react';
import PostCard from './PostCard';
import NewsCard from './NewsCard';
import FilterToggle from './FilterToggle';
import type { FeedItem, FilterType } from '@/types';

interface Props {
  onCountsChange?: (counts: { all: number; tweet: number; news: number }) => void;
}

const PAGE_SIZE = 18;

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-card border border-slate-100 animate-pulse">
      <div className="aspect-video bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-3 w-16 bg-slate-200 rounded" />
        </div>
        <div className="h-4 w-full bg-slate-200 rounded" />
        <div className="h-4 w-4/5 bg-slate-200 rounded" />
        <div className="h-3 w-3/5 bg-slate-200 rounded" />
        <div className="h-px bg-slate-100" />
        <div className="flex justify-between">
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-3 w-6 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Feed({ onCountsChange }: Props) {
  const [allItems, setAllItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/posts?limit=100')
      .then((r) => r.json())
      .then((res) => {
        const items: FeedItem[] = res.data ?? [];
        setAllItems(items);
        onCountsChange?.({
          all: items.length,
          tweet: items.filter((i) => i.type === 'tweet').length,
          news: items.filter((i) => i.type === 'news').length,
        });
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

  useEffect(() => { setPage(1); }, [filter]);

  const counts = {
    all: allItems.length,
    tweet: allItems.filter((i) => i.type === 'tweet').length,
    news: allItems.filter((i) => i.type === 'news').length,
  };

  if (loading) {
    return (
      <div>
        <div className="h-11 w-80 bg-slate-100 rounded-xl animate-pulse mb-6" />
        <div className="grid sm:grid-cols-2 gap-5">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <FilterToggle value={filter} onChange={setFilter} counts={counts} />

      {visible.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <span className="text-3xl">📰</span>
          </div>
          <p className="text-lg font-semibold text-slate-600 mb-1">No stories yet</p>
          <p className="text-sm text-slate-400">The first data refresh will populate this feed.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
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
        <div ref={sentinelRef} className="flex justify-center py-10">
          {loadingMore && (
            <div className="flex gap-1.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-indigo-300 animate-bounce"
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
