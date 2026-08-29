// src/hooks/useRoomData.ts
// 데이터 로딩 훅 두 개.
// - useRoomCounts: 지금 만들고 있는 문장 기준으로 개수를 서버에서 다시 계산합니다.
//                  (포맷을 바꾸면 주제별 숫자가 같이 바뀌는 동작)
// - useLiveRooms:  홈 하단 "지금 진행 중" 스트립.

"use client";

import { useEffect, useState } from "react";
import { fetchLive, fetchRooms, type LiveResponse } from "@/lib/api";
import { serializeQuery } from "@/lib/query";
import type { RoomsResponse, SearchQuery, TaxonomyCounts } from "@/lib/types";

interface CountsState {
  counts: TaxonomyCounts | null;
  total: number | null;
  loading: boolean;
  error: string | null;
}

export function useRoomCounts(query: SearchQuery, enabled = true): CountsState {
  const key = serializeQuery(query);
  const [state, setState] = useState<CountsState>({
    counts: null,
    total: null,
    loading: enabled,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchRooms(query, { limit: 1, signal: ctrl.signal })
      .then((res: RoomsResponse) => {
        setState({
          counts: res.counts,
          total: res.total,
          loading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({
          counts: null,
          total: null,
          loading: false,
          error: err instanceof Error ? err.message : "Something went wrong",
        });
      });

    return () => ctrl.abort();
    // key 로 비교해야 객체 새로 만들 때마다 재요청하지 않습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return state;
}

interface RoomsState {
  data: RoomsResponse | null;
  loading: boolean;
  error: string | null;
}

export function useRooms(query: SearchQuery): RoomsState {
  const key = serializeQuery(query);
  const [state, setState] = useState<RoomsState>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchRooms(query, { signal: ctrl.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Something went wrong",
        });
      });

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

export function useLiveRooms(pollMs = 60000) {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    const load = () => {
      fetchLive(ctrl.signal)
        .then((res) => {
          if (!cancelled) {
            setData(res);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();
    const t = window.setInterval(load, pollMs);
    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(t);
    };
  }, [pollMs]);

  return { data, loading };
}
