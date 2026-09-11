// src/app/api/rooms/route.ts
// GET /api/rooms?topic=Marketing&field=Business&format=Test%20Prep&day=2&when=evening
// → { rooms, total, counts }
//
// 홈 화면 SentenceBuilder가 이 라우트로 "N rooms match so far" 숫자를 다시 계산합니다.
// 실제 study_rooms 테이블 기준으로 계산하고(lib/roomsDb.ts), 방 목록 자체는
// 홈 화면에서 안 보여주므로(숫자만 씀) rooms는 항상 빈 배열로 내려줍니다 —
// 실제 목록은 /explore가 study_rooms를 직접 불러와서 따로 보여줍니다.

import { NextResponse } from "next/server";
import { parseQuery } from "@/lib/query";
import { computeRealCounts } from "@/lib/roomsDb";
import type { RoomsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = parseQuery(searchParams);

  try {
    const counts = await computeRealCounts(q);
    const body: RoomsResponse = {
      rooms: [],
      total: counts.total,
      counts,
    };
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load rooms" },
      { status: 500 }
    );
  }
}
