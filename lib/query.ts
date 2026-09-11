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

const FORMAT_IDS = new Set<string>(FORMATS.map((f) => f.id));
const DAYPART_IDS = new Set<string>(DAYPARTS.map((d) => d.id));

type ParamsLike = {
  get(name: string): string | null;
};

export function parseQuery(params: ParamsLike): SearchQuery {
  // topic/field는 real categories 테이블의 layer_2/layer_1 값 그대로입니다
  // (별도 slug id가 아니라 텍스트 자체가 id) — 그래서 조회 없이 그대로 씁니다.
  const topic = params.get("topic");

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
    subcategoryId: topic,
    categoryId: params.get("field"),
    format,
    weekday,
    daypart,
  };
}

export function serializeQuery(q: SearchQuery): string {
  const p = new URLSearchParams();
  if (q.subcategoryId) p.set("topic", q.subcategoryId);
  if (q.categoryId) p.set("field", q.categoryId);
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
  // subcategoryId 자체가 real categories 테이블의 layer_2 텍스트(=라벨)입니다.
  return q.subcategoryId ?? "something";
}

export function formatLabel(q: SearchQuery): string {
  // FormatId 값 자체가 study_types.code(=화면에 뜨는 라벨)와 같은 텍스트라
  // 별도 조회 없이 그대로 소문자로 씁니다.
  return q.format ? q.format.toLowerCase() : "any format";
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
