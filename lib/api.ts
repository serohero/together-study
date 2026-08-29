// src/lib/api.ts
// 클라이언트에서 쓰는 fetch 래퍼. 컴포넌트가 fetch를 직접 호출하지 않게 합니다.
// 요청 취소(AbortSignal)를 지원해서, 사용자가 빠르게 필터를 바꿔도
// 늦게 도착한 이전 응답이 화면을 덮어쓰지 않습니다.

import { serializeQuery } from "./query";
import type { RoomsResponse, SearchQuery } from "./types";
import type { LiveResponse } from "@/app/api/live/route";

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) — ${url}`);
  }
  return (await res.json()) as T;
}

export function fetchRooms(
  q: SearchQuery,
  opts: { limit?: number; signal?: AbortSignal } = {}
): Promise<RoomsResponse> {
  const params = serializeQuery(q);
  const limit = opts.limit ? `${params ? "&" : ""}limit=${opts.limit}` : "";
  return getJson<RoomsResponse>(`/api/rooms?${params}${limit}`, opts.signal);
}

export function fetchLive(signal?: AbortSignal): Promise<LiveResponse> {
  return getJson<LiveResponse>("/api/live", signal);
}

export type { LiveResponse };
