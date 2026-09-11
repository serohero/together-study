// src/hooks/useFormats.ts
// 실제 study_types 테이블을 한 번만 불러와서 메모리에 캐싱합니다.
// (useCategories.ts와 같은 패턴.)

"use client";

import { useEffect, useState } from "react";
import type { FormatOption } from "@/lib/formatsDb";

let cache: FormatOption[] | null = null;
let inflight: Promise<FormatOption[]> | null = null;

async function loadFormats(): Promise<FormatOption[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch("/api/formats", { headers: { accept: "application/json" } })
      .then((res) => res.json())
      .then((body: { formats?: FormatOption[] }) => {
        cache = body.formats ?? [];
        return cache;
      })
      .catch(() => {
        inflight = null;
        return [] as FormatOption[];
      });
  }
  return inflight;
}

export function useFormats(): { formats: FormatOption[]; loading: boolean } {
  const [formats, setFormats] = useState<FormatOption[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setFormats(cache);
      setLoading(false);
      return;
    }
    let cancelled = false;
    loadFormats().then((f) => {
      if (!cancelled) {
        setFormats(f);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { formats, loading };
}
