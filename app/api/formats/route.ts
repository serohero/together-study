// src/app/api/formats/route.ts
// GET /api/formats → { formats: { id, label, blurb }[] }
// 실제 study_types 테이블을 FormatPicker가 쓰는 목록 모양으로 내려줍니다.

import { NextResponse } from "next/server";
import { fetchFormatsFromDb, type FormatOption } from "@/lib/formatsDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const formats = await fetchFormatsFromDb();
    return NextResponse.json({ formats });
  } catch (err) {
    const empty: FormatOption[] = [];
    return NextResponse.json(
      { formats: empty, error: err instanceof Error ? err.message : "Failed to load formats" },
      { status: 500 }
    );
  }
}
