// src/app/api/rooms/route.ts
// GET /api/rooms?topic=english&format=test-prep&day=2&when=evening
// → { rooms, total, counts }

import { NextResponse } from "next/server";
import { parseQuery } from "@/lib/query";
import { computeCounts, listRooms } from "@/lib/rooms";
import type { RoomsResponse } from "@/lib/types";

// 시드 데이터는 서버 시각(진행 중 여부)에 의존하므로 캐시하지 않습니다.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = parseQuery(searchParams);

  const limitRaw = Number(searchParams.get("limit"));
  const limit =
    Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 100 ? limitRaw : 24;

  const body: RoomsResponse = {
    rooms: listRooms(q, limit),
    total: computeCounts(q).total,
    counts: computeCounts(q),
  };

  return NextResponse.json(body);
}
