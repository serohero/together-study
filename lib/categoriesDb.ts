// src/lib/categoriesDb.ts
// 실제 Supabase `categories` 테이블(layer_1/layer_2)을 앱이 쓰는
// Category/Subcategory 트리 모양으로 바꿔주는 공용 헬퍼.
// /api/categories 라우트와 lib/roomsDb.ts(카운트 계산)가 같이 씁니다.
//
// 참고: 홈 화면 예전 토픽 피커는 lib/taxonomy.ts의 하드코딩 84개 목록을
// 썼는데, 그건 이 real categories 테이블과 값이 전혀 다른 별개 목록이었습니다.
// 지금은 real DB로 완전히 갈아끼웠고, lib/taxonomy.ts는 목업 방 생성기
// (lib/rooms.ts, "지금 진행 중" 스트립용)에서만 씁니다.

import { supabase } from "./supabase";
import type { Category } from "./types";

export async function fetchCategoriesFromDb(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("layer_1, layer_2");

  if (error) throw error;

  const byLayer1 = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const l1 = (row as { layer_1: string | null }).layer_1;
    const l2 = (row as { layer_2: string | null }).layer_2;
    if (!l1) continue;
    if (!byLayer1.has(l1)) byLayer1.set(l1, new Set());
    if (l2) byLayer1.get(l1)!.add(l2);
  }

  return Array.from(byLayer1.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([layer1, layer2Set]) => ({
      id: layer1,
      label: layer1,
      subcategories: Array.from(layer2Set)
        .sort((a, b) => a.localeCompare(b))
        .map((layer2) => ({
          id: layer2,
          label: layer2,
          categoryId: layer1,
        })),
    }));
}
