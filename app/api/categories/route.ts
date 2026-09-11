// src/app/api/categories/route.ts
// GET /api/categories → { categories: Category[] }
// 실제 categories 테이블(layer_1/layer_2)을 홈 화면 토픽 피커가 쓰는
// Category/Subcategory 트리 모양으로 내려줍니다.

import { NextResponse } from "next/server";
import { fetchCategoriesFromDb } from "@/lib/categoriesDb";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await fetchCategoriesFromDb();
    return NextResponse.json({ categories });
  } catch (err) {
    const empty: Category[] = [];
    return NextResponse.json(
      { categories: empty, error: err instanceof Error ? err.message : "Failed to load categories" },
      { status: 500 }
    );
  }
}
