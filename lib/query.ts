// src/lib/query.ts
// URL 쿼리스트링 ↔ SearchQuery 변환. 화면 상태의 진실은 항상 URL에 있습니다.
// 그래야 새로고침·뒤로가기·링크 공유가 전부 공짜로 됩니다.

import {
  DAYPARTS,
  EMPTY_QUERY,
  FORMATS,
  WEEKDAYS,
  type DaypartId,
  type FormatId,
  type SearchQuery,
  type Weekday,
} from "./types";
import { getSubcategory } from "./taxonomy";

const FORMAT_IDS = new Set<string>(FORMATS.map((f) => f.id));
const DAYPART_IDS = new Set<string>(DAYPARTS.map((d) => d.id));

type ParamsLike = {
  get(name: string): string | null;
};

export function parseQuery(params: ParamsLike): SearchQuery {
  const topic = params.get("topic");
  const sub = getSubcategory(topic);

  const formatRaw = params.get("format");
  const format: FormatId | null =
    formatRaw && FORMAT_IDS.has(formatRaw) ? (formatRaw as FormatId) : null;

  const dayRaw = params.get("day");
  const dayNum = dayRaw === null ? NaN : Number(dayRaw);
  const weekday: Weekday | null =
    Number.isInteger(dayNum) && dayNum >= 0 && dayNum <= 6
      ? (dayNum as Weekday)
      : null;

  const dpRaw = params.get("when");
  const daypart: DaypartId | null =
    dpRaw && DAYPART_IDS.has(dpRaw) ? (dpRaw as DaypartId) : null;

  return {
    subcategoryId: sub ? sub.id : null,
    categoryId: sub ? sub.categoryId : params.get("field"),
    format,
    weekday,
    daypart,
  };
}

export function serializeQuery(q: SearchQuery): string {
  const p = new URLSearchParams();
  if (q.subcategoryId) p.set("topic", q.subcategoryId);
  else if (q.categoryId) p.set("field", q.categoryId);
  if (q.format) p.set("format", q.format);
  if (q.weekday !== null) p.set("day", String(q.weekday));
  if (q.daypart) p.set("when", q.daypart);
  return p.toString();
}

export function isEmptyQuery(q: SearchQuery): boolean {
  return (
    q.subcategoryId === null &&
    q.categoryId === null &&
    q.format === null &&
    q.weekday === null &&
    q.daypart === null
  );
}

export { EMPTY_QUERY };

/* ---------------- 문장에 들어갈 라벨 ---------------- */

export function topicLabel(q: SearchQuery): string {
  const sub = getSubcategory(q.subcategoryId);
  if (sub) return sub.label;
  return "something";
}

export function formatLabel(q: SearchQuery): string {
  const f = FORMATS.find((x) => x.id === q.format);
  return f ? f.label.toLowerCase() : "any format";
}

export function timeLabel(q: SearchQuery): string {
  const day = WEEKDAYS.find((d) => d.id === q.weekday);
  const part = DAYPARTS.find((d) => d.id === q.daypart);
  if (day && part) return `${day.long.replace(/s$/, "")} ${part.label.toLowerCase()}`;
  if (day) return day.long.toLowerCase();
  if (part) return part.label.toLowerCase();
  return "any time";
}

/** 카드 등에서 쓰는 시각 포맷: 19:00 → "7:00 PM" */
export function formatClock(hour: number, minute: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h12}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

export function weekdayLong(weekday: number): string {
  return WEEKDAYS.find((d) => d.id === weekday)?.long ?? "";
}
