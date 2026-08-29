// src/app/api/live/route.ts
// GET /api/live → 지금 진행 중인 방 (홈 하단 스트립용)

import { NextResponse } from "next/server";
import { listLiveRooms, liveRoomCount, minutesIn } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export interface LiveRoomDto {
  id: string;
  title: string;
  minutesIn: number;
  peopleHere: number;
  weekCurrent: number;
  weeksTotal: number;
}

export interface LiveResponse {
  count: number;
  rooms: LiveRoomDto[];
}

export async function GET() {
  const now = new Date();
  const rooms = listLiveRooms(4, now);

  const body: LiveResponse = {
    count: liveRoomCount(now),
    rooms: rooms.map((r) => ({
      id: r.id,
      title: r.title,
      minutesIn: r.liveSince
        ? Math.max(
            0,
            Math.round((now.getTime() - new Date(r.liveSince).getTime()) / 60000)
          ) || minutesIn(r, now)
        : minutesIn(r, now),
      peopleHere: Math.max(2, r.seatsTaken),
      weekCurrent: r.weekCurrent,
      weeksTotal: r.weeksTotal,
    })),
  };

  return NextResponse.json(body);
}
