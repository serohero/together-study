// src/lib/roomsDb.ts
// 실제 study_rooms 테이블 기준으로 TaxonomyCounts(피커 숫자, "N rooms match")를
// 계산합니다. 토픽 전체 목록은 categoriesDb.ts, 포맷 전체 목록은 formatsDb.ts에서
// 각각 real DB로 가져옵니다. lib/rooms.ts의 computeCounts는 목업 데이터용으로
// 그대로 남겨뒀고("지금 진행 중" 스트립이 아직 그걸 씁니다), 이 파일이 real DB
// 버전이고 /api/rooms 라우트가 이걸 씁니다.
//
// ▶ 시간(weekday/daypart) 필터는 study_rooms.schedule이 자유 텍스트라
//   아직 실제 필터링에 반영하지 않습니다 — 홈 화면에서는 장식용으로만
//   남겨둔 상태입니다. schedule이 구조화되면 여기 matches()에 추가하면 됩니다.

import { supabase } from "./supabase";
import { fetchCategoriesFromDb } from "./categoriesDb";
import { fetchFormatsFromDb } from "./formatsDb";
import type { FormatId, SearchQuery, TaxonomyCounts } from "./types";

interface RoomFilterRow {
  industry_1: string | null;
  industry_2: string | null;
  study_type: string | null;
}

function matches(r: RoomFilterRow, q: SearchQuery): boolean {
  if (q.subcategoryId && r.industry_2 !== q.subcategoryId) return false;
  if (!q.subcategoryId && q.categoryId && r.industry_1 !== q.categoryId) return false;
  if (q.format && r.study_type !== q.format) return false;
  return true;
}

export async function computeRealCounts(q: SearchQuery): Promise<TaxonomyCounts> {
  const [roomsResult, categories, formats] = await Promise.all([
    supabase.from("study_rooms").select("industry_1, industry_2, study_type"),
    fetchCategoriesFromDb(),
    fetchFormatsFromDb(),
  ]);

  if (roomsResult.error) throw roomsResult.error;
  const rooms: RoomFilterRow[] = roomsResult.data ?? [];

  const byCategory: Record<string, number> = {};
  const bySubcategory: Record<string, number> = {};
  for (const c of categories) {
    byCategory[c.id] = 0;
    for (const s of c.subcategories) bySubcategory[s.id] = 0;
  }

  const byFormat = Object.fromEntries(formats.map((f) => [f.id, 0])) as Record<
    FormatId,
    number
  >;

  const scope: SearchQuery = { ...q, subcategoryId: null, categoryId: null };
  const noFormat: SearchQuery = { ...q, format: null };

  for (const r of rooms) {
    if (matches(r, scope)) {
      if (r.industry_1 && r.industry_1 in byCategory) byCategory[r.industry_1] += 1;
      if (r.industry_2 && r.industry_2 in bySubcategory) bySubcategory[r.industry_2] += 1;
    }
    if (r.study_type && matches(r, noFormat) && (r.study_type as FormatId) in byFormat) {
      byFormat[r.study_type as FormatId] += 1;
    }
  }

  const siblingFormats = formats.map((f) => ({
    format: f.id,
    label: f.label,
    count: byFormat[f.id],
  })).filter((f) => f.format !== q.format && f.count > 0);

  const total = rooms.filter((r) => matches(r, q)).length;

  return { byCategory, bySubcategory, byFormat, siblingFormats, total };
}
