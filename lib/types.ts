// src/lib/types.ts
// 도메인 타입. 서버·클라이언트 양쪽에서 씁니다.

/** 방의 네 가지 포맷. DB enum과 1:1로 맞추세요. */
export type FormatId = "test-prep" | "interview" | "project" | "study";

export const FORMATS: { id: FormatId; label: string; blurb: string }[] = [
  { id: "test-prep", label: "Test Prep", blurb: "One exam, one date" },
  { id: "interview", label: "Interview", blurb: "Mock rounds, in pairs" },
  { id: "project", label: "Project", blurb: "Build and ship something" },
  { id: "study", label: "Study", blurb: "Show up and work" },
];

/** 요일. 0 = 일요일 (JS Date.getDay()와 동일) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAYS: { id: Weekday; short: string; long: string }[] = [
  { id: 1, short: "Mon", long: "Mondays" },
  { id: 2, short: "Tue", long: "Tuesdays" },
  { id: 3, short: "Wed", long: "Wednesdays" },
  { id: 4, short: "Thu", long: "Thursdays" },
  { id: 5, short: "Fri", long: "Fridays" },
  { id: 6, short: "Sat", long: "Saturdays" },
  { id: 0, short: "Sun", long: "Sundays" },
];

/** 시간대 묶음. startHour <= h < endHour (24시간, 방의 로컬 표시 기준) */
export type DaypartId = "early" | "day" | "evening" | "late";

export const DAYPARTS: {
  id: DaypartId;
  label: string;
  hint: string;
  startHour: number;
  endHour: number;
}[] = [
  { id: "early", label: "Early morning", hint: "5–9am", startHour: 5, endHour: 9 },
  { id: "day", label: "Daytime", hint: "9am–5pm", startHour: 9, endHour: 17 },
  { id: "evening", label: "Evening", hint: "5–9pm", startHour: 17, endHour: 21 },
  { id: "late", label: "Late", hint: "9pm–midnight", startHour: 21, endHour: 24 },
];

export interface Subcategory {
  id: string;
  label: string;
  categoryId: string;
}

export interface Category {
  id: string;
  label: string;
  subcategories: Subcategory[];
}

export interface Host {
  id: string;
  name: string;
  /** 0–100. 아직 세션 이력이 없으면 null → UI에서 "New"로 표시 */
  showRate: number | null;
  sessionsRun: number;
}

export interface Room {
  id: string;
  title: string;
  categoryId: string;
  subcategoryId: string;
  format: FormatId;
  /** 매주 몇 요일에 모이는지 */
  weekday: Weekday;
  /** 0–23, 방이 공지한 로컬 시각 */
  hour: number;
  minute: number;
  durationMin: number;
  seatsTotal: number;
  seatsTaken: number;
  /** 이 인원이 차야 첫 세션이 열립니다 (정족수) */
  quorum: number;
  weeksTotal: number;
  /** 아직 시작 전이면 0 */
  weekCurrent: number;
  startsOn: string; // ISO date
  host: Host;
  /** Test Prep 전용. 그 외 포맷은 null */
  examDate: string | null;
  /** 지금 이 순간 모임이 진행 중인지 */
  liveSince: string | null; // ISO datetime
  waitlistCount: number;
}

/** 방의 상태는 이 일곱 가지가 전부입니다. */
export type RoomStatus =
  | "recruiting" // 정족수 미달
  | "quorum-met" // 정족수는 찼고 자리 남음
  | "full"
  | "running"
  | "in-session"
  | "ended";

export interface SearchQuery {
  subcategoryId: string | null;
  categoryId: string | null;
  format: FormatId | null;
  weekday: Weekday | null;
  daypart: DaypartId | null;
}

export const EMPTY_QUERY: SearchQuery = {
  subcategoryId: null,
  categoryId: null,
  format: null,
  weekday: null,
  daypart: null,
};

/** 피커에 뿌릴 개수 정보 */
export interface TaxonomyCounts {
  byCategory: Record<string, number>;
  bySubcategory: Record<string, number>;
  byFormat: Record<FormatId, number>;
  /** 현재 선택된 주제 안에서 포맷별 개수 (결과 화면의 "Also in ..." 줄) */
  siblingFormats: { format: FormatId; label: string; count: number }[];
  total: number;
}

export interface RoomsResponse {
  rooms: Room[];
  total: number;
  counts: TaxonomyCounts;
}
