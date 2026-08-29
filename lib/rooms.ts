// src/lib/rooms.ts
// 데이터 소스 + 조회 로직. 지금은 메모리 시드 데이터로 돌아갑니다.
//
// ▶ 실제 DB로 바꿀 때: 아래 `listRooms` / `countRooms` / `listLiveRooms`
//   세 함수의 본문만 교체하면 됩니다. 나머지 코드는 손댈 필요 없습니다.
//   예) const rows = await prisma.room.findMany({ where: buildWhere(q) })

import {
  DAYPARTS,
  FORMATS,
  type DaypartId,
  type FormatId,
  type Room,
  type RoomStatus,
  type SearchQuery,
  type TaxonomyCounts,
  type Weekday,
} from "./types";
import { CATEGORIES, SUBCATEGORIES } from "./taxonomy";

/* ------------------------------------------------------------------ */
/* 시드 데이터 생성 — 빌드마다 같은 결과가 나오도록 고정 시드를 씁니다.   */
/* ------------------------------------------------------------------ */

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const HOST_NAMES = [
  "Mira K.", "Dan R.", "Ana P.", "Tomas B.", "Wei C.", "Ravi S.", "Naomi F.",
  "Marco D.", "Joon H.", "Elena V.", "Anders L.", "Priya N.", "Sam O.",
  "Yuki T.", "Lena M.", "Omar A.", "Grace L.", "Diego F.",
];

const TITLE_SHAPES: Record<FormatId, string[]> = {
  "test-prep": [
    "{topic} — full mock every week",
    "{topic}, timed drills",
    "{topic} before work",
    "{topic} — the sections everyone dodges",
  ],
  interview: [
    "{topic} mocks, in rotating pairs",
    "{topic} — one presents, the room panels",
    "{topic} behavioural rounds",
    "{topic} interview reps",
  ],
  project: [
    "Ship a {topic} project in ten weeks",
    "{topic} — build in public, weekly",
    "{topic} portfolio piece, start to finish",
  ],
  study: [
    "{topic} — quiet hour, cameras on",
    "{topic} study, same six people",
    "{topic} — read and discuss",
    "Morning {topic}",
  ],
};

/** 서브카테고리별 인기도. 방 개수를 현실적으로 흩뜨리는 용도입니다. */
const POPULAR = new Set([
  "ai", "software-engineering", "data-science", "product-management",
  "mcat", "medical-school", "lsat", "management-consulting", "mba",
  "investment-banking", "private-equity", "english", "spanish", "mandarin",
  "marketing", "web-development",
]);

function buildRooms(): Room[] {
  const rng = makeRng(20260821);
  const rooms: Room[] = [];
  const now = Date.now();
  let n = 0;

  for (const sc of SUBCATEGORIES) {
    const base = POPULAR.has(sc.id) ? 9 : 3;
    const count = Math.max(0, Math.round(base * (0.35 + rng() * 1.3)) - 1);

    for (let i = 0; i < count; i++) {
      const format = FORMATS[Math.floor(rng() * FORMATS.length)].id;
      // 저녁·주말에 몰리게 가중치를 줍니다.
      const weekdayPool: Weekday[] = [1, 2, 2, 3, 3, 4, 4, 5, 6, 6, 0];
      const weekday = weekdayPool[Math.floor(rng() * weekdayPool.length)];
      const hourPool = [6, 7, 7, 8, 9, 12, 13, 17, 18, 19, 19, 19, 20, 20, 21];
      const hour = hourPool[Math.floor(rng() * hourPool.length)];
      const minute = rng() < 0.72 ? 0 : 30;

      const seatsTotal = [4, 5, 6, 6, 8][Math.floor(rng() * 5)];
      const quorum = Math.max(3, Math.ceil(seatsTotal * 0.6));

      const weeksTotal = format === "project" ? 10 : format === "test-prep" ? 8 : 6;
      const started = rng() < 0.45;
      const weekCurrent = started
        ? 1 + Math.floor(rng() * Math.max(1, weeksTotal - 1))
        : 0;

      // 이미 진행 중인 방은 정족수를 넘긴 상태여야 앞뒤가 맞습니다.
      const seatsTaken = started
        ? quorum + Math.floor(rng() * (seatsTotal - quorum + 1))
        : Math.floor(rng() * (seatsTotal + 1));

      const showRate =
        rng() < 0.12 ? null : 78 + Math.floor(rng() * 23); // 78–100

      const startsOn = new Date(now + (started ? -1 : 1) * (2 + Math.floor(rng() * 26)) * 86400000);

      // "Morning ..." 은 오전 방에만 붙입니다.
      const morningOnly = (t: string) =>
        t.startsWith("Morning") || t.includes("before work");
      const shapes = TITLE_SHAPES[format].filter(
        (t) => hour < 11 || !morningOnly(t)
      );
      const title = shapes[Math.floor(rng() * shapes.length)].replace(
        "{topic}",
        sc.label
      );

      rooms.push({
        id: `rm_${(++n).toString(36).padStart(4, "0")}`,
        title,
        categoryId: sc.categoryId,
        subcategoryId: sc.id,
        format,
        weekday,
        hour,
        minute,
        durationMin: [45, 60, 60, 75, 90][Math.floor(rng() * 5)],
        seatsTotal,
        seatsTaken,
        quorum,
        weeksTotal,
        weekCurrent,
        startsOn: startsOn.toISOString().slice(0, 10),
        host: {
          id: `h_${Math.floor(rng() * 9999)}`,
          name: HOST_NAMES[Math.floor(rng() * HOST_NAMES.length)],
          showRate,
          sessionsRun: showRate === null ? 0 : 4 + Math.floor(rng() * 40),
        },
        examDate:
          format === "test-prep"
            ? new Date(now + (40 + Math.floor(rng() * 80)) * 86400000)
                .toISOString()
                .slice(0, 10)
            : null,
        liveSince: null,
        waitlistCount: seatsTaken >= seatsTotal ? Math.floor(rng() * 6) : 0,
      });
    }
  }
  return rooms;
}

export const ROOMS: Room[] = buildRooms();

/* ------------------------------------------------------------------ */
/* 상태 계산                                                            */
/* ------------------------------------------------------------------ */

export function roomStatus(room: Room, now = new Date()): RoomStatus {
  if (isLive(room, now)) return "in-session";
  if (room.weekCurrent >= room.weeksTotal && room.weekCurrent > 0) return "ended";
  if (room.weekCurrent > 0) return "running";
  if (room.seatsTaken >= room.seatsTotal) return "full";
  if (room.seatsTaken < room.quorum) return "recruiting";
  return "quorum-met";
}

export function seatsLeft(room: Room): number {
  return Math.max(0, room.seatsTotal - room.seatsTaken);
}

export function seatsToQuorum(room: Room): number {
  return Math.max(0, room.quorum - room.seatsTaken);
}

/**
 * 지금 진행 중인지. 서버 시각 기준으로 계산하므로 시드 데이터에
 * liveSince를 박아둘 필요가 없습니다.
 */
export function isLive(room: Room, now = new Date()): boolean {
  if (room.weekCurrent === 0) return false;
  if (now.getDay() !== room.weekday) return false;
  const startMin = room.hour * 60 + room.minute;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= startMin && nowMin < startMin + room.durationMin;
}

export function minutesIn(room: Room, now = new Date()): number {
  const startMin = room.hour * 60 + room.minute;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return Math.max(0, nowMin - startMin);
}

/* ------------------------------------------------------------------ */
/* 조회                                                                */
/* ------------------------------------------------------------------ */

function inDaypart(hour: number, daypart: DaypartId): boolean {
  const d = DAYPARTS.find((x) => x.id === daypart);
  if (!d) return true;
  return hour >= d.startHour && hour < d.endHour;
}

export function matches(room: Room, q: SearchQuery): boolean {
  if (q.subcategoryId && room.subcategoryId !== q.subcategoryId) return false;
  if (!q.subcategoryId && q.categoryId && room.categoryId !== q.categoryId)
    return false;
  if (q.format && room.format !== q.format) return false;
  if (q.weekday !== null && room.weekday !== q.weekday) return false;
  if (q.daypart && !inDaypart(room.hour, q.daypart)) return false;
  return true;
}

/** 정렬: 자리가 있는 방 먼저 → 시작이 이른 순 → 시간 순 */
function sortRooms(a: Room, b: Room): number {
  const aOpen = seatsLeft(a) > 0 ? 0 : 1;
  const bOpen = seatsLeft(b) > 0 ? 0 : 1;
  if (aOpen !== bOpen) return aOpen - bOpen;
  if (a.startsOn !== b.startsOn) return a.startsOn < b.startsOn ? -1 : 1;
  return a.hour * 60 + a.minute - (b.hour * 60 + b.minute);
}

export function listRooms(q: SearchQuery, limit = 24): Room[] {
  return ROOMS.filter((r) => matches(r, q))
    .sort(sortRooms)
    .slice(0, limit);
}

export function countRooms(q: SearchQuery): number {
  return ROOMS.reduce((n, r) => (matches(r, q) ? n + 1 : n), 0);
}

export function listLiveRooms(limit = 4, now = new Date()): Room[] {
  const live = ROOMS.filter((r) => isLive(r, now));
  if (live.length >= limit) {
    return live
      .sort((a, b) => minutesIn(b, now) - minutesIn(a, now))
      .slice(0, limit)
      .map((r) => ({ ...r, liveSince: now.toISOString() }));
  }
  // 시드 데이터라 지금 이 시각에 정말 진행 중인 방이 없을 수 있습니다.
  // 데모가 비어 보이지 않게 "진행 중"으로 보일 방을 결정적으로 골라 채웁니다.
  // ▶ 실제 DB를 붙이면 이 fallback 블록은 지우세요.
  const filler = ROOMS.filter((r) => r.weekCurrent > 0 && !live.includes(r))
    .slice(0, limit - live.length)
    .map((r, i) => ({
      ...r,
      liveSince: new Date(now.getTime() - (8 + i * 11) * 60000).toISOString(),
    }));
  return [...live.map((r) => ({ ...r, liveSince: now.toISOString() })), ...filler];
}

export function liveRoomCount(now = new Date()): number {
  const real = ROOMS.filter((r) => isLive(r, now)).length;
  return real > 0 ? real : 31; // ▶ DB 연결 후 `return real;` 로 바꾸세요.
}

/* ------------------------------------------------------------------ */
/* 개수 집계 — 피커의 숫자, 결과 화면의 "Also in ..." 줄에 씁니다.        */
/* ------------------------------------------------------------------ */

export function computeCounts(q: SearchQuery): TaxonomyCounts {
  const byCategory: Record<string, number> = {};
  const bySubcategory: Record<string, number> = {};
  const byFormat = {
    "test-prep": 0,
    interview: 0,
    project: 0,
    study: 0,
  } as Record<FormatId, number>;

  for (const c of CATEGORIES) byCategory[c.id] = 0;
  for (const s of SUBCATEGORIES) bySubcategory[s.id] = 0;

  // 주제 개수는 "포맷·시간 필터만 적용한" 기준으로 셉니다.
  // 그래야 주제를 바꿔가며 비교할 때 숫자가 의미가 있습니다.
  const scope: SearchQuery = {
    ...q,
    subcategoryId: null,
    categoryId: null,
  };

  for (const r of ROOMS) {
    if (matches(r, scope)) {
      byCategory[r.categoryId] = (byCategory[r.categoryId] ?? 0) + 1;
      bySubcategory[r.subcategoryId] = (bySubcategory[r.subcategoryId] ?? 0) + 1;
    }
    // 포맷 개수는 주제·시간은 적용하되 포맷만 뺀 기준으로 셉니다.
    const noFormat: SearchQuery = { ...q, format: null };
    if (matches(r, noFormat)) byFormat[r.format] += 1;
  }

  const siblingFormats = FORMATS.map((f) => ({
    format: f.id,
    label: f.label,
    count: byFormat[f.id],
  })).filter((f) => f.format !== q.format && f.count > 0);

  return {
    byCategory,
    bySubcategory,
    byFormat,
    siblingFormats,
    total: countRooms(q),
  };
}
