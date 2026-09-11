// src/hooks/useCategories.ts
// 실제 categories 테이블을 한 번만 불러와서 메모리에 캐싱합니다.
// (거의 안 바뀌는 데이터라 토픽 팝오버 열 때마다 다시 부를 필요는 없습니다.)

"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/lib/types";

let cache: Category[] | null = null;
let inflight: Promise<Category[]> | null = null;

async function loadCategories(): Promise<Category[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch("/api/categories", { headers: { accept: "application/json" } })
      .then((res) => res.json())
      .then((body: { categories?: Category[] }) => {
        cache = body.categories ?? [];
        return cache;
      })
      .catch(() => {
        inflight = null;
        return [] as Category[];
      });
  }
  return inflight;
}

export function useCategories(): { categories: Category[]; loading: boolean } {
  const [categories, setCategories] = useState<Category[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setCategories(cache);
      setLoading(false);
      return;
    }
    let cancelled = false;
    loadCategories().then((cats) => {
      if (!cancelled) {
        setCategories(cats);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading };
}
