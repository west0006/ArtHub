'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useInfiniteScroll(callback: () => void, enabled: boolean = true) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const setLoadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadMoreRef.current) {
        observerRef.current?.unobserve(loadMoreRef.current);
      }
      if (node && enabled) {
        observerRef.current?.observe(node);
      }
      loadMoreRef.current = node;
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold: 0.1 }
    );
    return () => observerRef.current?.disconnect();
  }, [callback, enabled]);

  return { loadMoreRef: setLoadMoreRef };
}