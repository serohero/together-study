// components/StudyRoomCard.tsx
// /explore 카드. study_rooms(Supabase) 로우를 그대로 렌더링합니다.
// (components/RoomCard.tsx는 옛날 시드 데이터용이라 그대로 남겨뒀어요 — 안 씀)

"use client";

import Link from "next/link";
import type { StudyRoomRow } from "@/lib/types";
import { c, font, shadow } from "./tokens";

function CategoryTag({ text, placeholder }: { text: string; placeholder?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 999,
        background: placeholder ? c.neutralTint : c.accentTint,
        color: placeholder ? c.ink3 : c.accent,
        fontStyle: placeholder ? "italic" : "normal",
      }}
    >
      {text}
    </span>
  );
}

export function StudyRoomCard({ room }: { room: StudyRoomRow }) {
  const max = room.max_members ?? 0;
  const current = room.current_members ?? 0;
  const full = max > 0 && current >= max;
  const seatsLeft = Math.max(0, max - current);

  return (
    <article
      style={{
        background: c.card,
        borderRadius: 11,
        padding: "24px 26px 22px",
        boxShadow: shadow.card,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <CategoryTag text={room.industry_1 || "To be added"} placeholder={!room.industry_1} />
        {room.industry_2 && room.industry_2 !== room.industry_1 && <CategoryTag text={room.industry_2} />}
        <CategoryTag text={room.study_type || "To be added"} placeholder={!room.study_type} />
      </div>

      <h3 style={{ margin: 0, fontFamily: font.display, fontWeight: 400, fontSize: 23, lineHeight: 1.25, color: c.ink }}>
        <Link href={`/room_detail/${room.id}`} prefetch={false} style={{ color: "inherit", textDecoration: "none" }}>
          {room.title}
        </Link>
      </h3>

      {room.description && (
        <p
          style={{
            margin: 0,
            fontFamily: font.ui,
            fontSize: 14,
            lineHeight: 1.55,
            color: c.ink2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {room.description}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: font.ui, fontSize: 13, color: c.ink3 }}>
        <span>{room.schedule || "Schedule not set yet"}</span>
        <span>{room.location_type === "Online" ? "📍 Online" : `📍 ${room.location_city || "Onsite"}`}</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid ${c.hairSoft}`,
          paddingTop: 15,
          marginTop: 2,
        }}
      >
        <span style={{ fontFamily: font.ui, fontSize: 14, color: full ? c.ink3 : c.ink2 }}>
          {full ? "Full" : `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left`}
          <span style={{ color: c.ink4 }}>
            {" "}
            · {current}/{max || "—"}
          </span>
        </span>
        <Link
          href={`/room_detail/${room.id}`}
          prefetch={false}
          style={{
            background: c.accent,
            color: "#FFFFFF",
            padding: "9px 18px",
            borderRadius: 6,
            fontFamily: font.ui,
            fontSize: 13.5,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          View room
        </Link>
      </div>
    </article>
  );
}
