// src/components/RoomCard.tsx
// 카드에 들어가는 정보는 다섯 개뿐입니다: 언제 / 무엇 / 믿을 만한가 / 자리 / 행동.
// 포맷 배지·시험일 박스·정원 총수는 일부러 뺐습니다 (목록에서는 중복이라서).

"use client";

import Link from "next/link";
import type { Room } from "@/lib/types";
import { formatClock, weekdayLong } from "@/lib/query";
import { c, font, shadow } from "./tokens";

function Seats({ total, taken }: { total: number; taken: number }) {
  return (
    <span style={{ display: "flex", gap: 5 }} aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            display: "block",
            background: i < taken ? c.accent : "transparent",
            border: i < taken ? "none" : `1px solid ${c.seatEmpty}`,
          }}
        />
      ))}
    </span>
  );
}

/** 카드 세 번째 줄. 지표를 나열하지 않고 한 문장으로 씁니다. */
function proofLine(room: Room): string {
  const parts: string[] = [];

  if (room.weekCurrent > 0) {
    parts.push(`In week ${room.weekCurrent} of ${room.weeksTotal}`);
  } else {
    const d = new Date(room.startsOn + "T00:00:00");
    const when = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    parts.push(`${room.weeksTotal} weeks from ${when}`);
  }

  if (room.examDate) {
    const e = new Date(room.examDate + "T00:00:00");
    parts.push(
      `finishes before the ${e.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} exam`
    );
  }

  const first = room.host.name.split(" ")[0];
  parts.push(
    room.host.showRate === null
      ? `${first} hosts — first season`
      : `${first} hosts, and turns up ${room.host.showRate}% of the time`
  );

  return parts.join(" · ") + ".";
}

export function RoomCard({ room, isLive = false }: { room: Room; isLive?: boolean }) {
  const seatsLeft = Math.max(0, room.seatsTotal - room.seatsTaken);
  const toQuorum = Math.max(0, room.quorum - room.seatsTaken);
  const full = seatsLeft === 0;
  const dimmed = full; // 진행 중이어도 자리가 있으면 또렷하게 둡니다.

  let seatText: string;
  let seatColor: string = c.ink2;
  if (full) {
    seatText = `Full · ${room.waitlistCount} waiting`;
    seatColor = c.ink3;
  } else if (toQuorum > 0) {
    seatText = `Starts once ${toQuorum} more join${toQuorum === 1 ? "s" : ""}`;
    seatColor = c.wait;
  } else {
    seatText = `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left`;
  }

  return (
    <article
      style={{
        background: c.card,
        borderRadius: 11,
        padding: "26px 28px 22px",
        boxShadow: shadow.card,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 34,
            color: dimmed ? c.ink4 : c.ink,
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          {formatClock(room.hour, room.minute)}
        </span>
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 12,
            color: dimmed ? c.ink4 : c.ink3,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
          }}
        >
          {weekdayLong(room.weekday)} · {room.durationMin} min
        </span>
        {isLive && (
          <span
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <span
              className="live-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: c.live,
                display: "block",
              }}
            />
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 10.5,
                color: c.live,
                letterSpacing: "0.08em",
              }}
            >
              MEETING NOW
            </span>
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <h3
          style={{
            margin: 0,
            fontFamily: font.display,
            fontWeight: 400,
            fontSize: 25,
            lineHeight: 1.2,
            color: dimmed ? c.ink2 : c.ink,
          }}
        >
          <Link
            href={`/rooms/${room.id}`}
            prefetch={false}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {room.title}
          </Link>
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: font.ui,
            fontSize: 14.5,
            lineHeight: 1.5,
            color: dimmed ? c.ink3 : c.ink2,
          }}
        >
          {proofLine(room)}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid ${c.hairSoft}`,
          paddingTop: 17,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <Seats total={room.seatsTotal} taken={room.seatsTaken} />
          <span style={{ fontFamily: font.ui, fontSize: 14, color: seatColor }}>
            {seatText}
          </span>
        </span>

        {full ? (
          <Link
            href={`/rooms/${room.id}?waitlist=1`}
            prefetch={false}
            style={{
              fontFamily: font.ui,
              fontSize: 14.5,
              fontWeight: 500,
              color: c.ink2,
              textDecoration: "none",
              borderBottom: `1px solid ${c.hair}`,
              paddingBottom: 2,
            }}
          >
            Join the waitlist
          </Link>
        ) : (
          <Link
            href={`/rooms/${room.id}/claim`}
            prefetch={false}
            style={{
              background: c.accent,
              color: "#FFFFFF",
              padding: "11px 22px",
              borderRadius: 6,
              fontFamily: font.ui,
              fontSize: 14.5,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Claim a seat
          </Link>
        )}
      </div>
    </article>
  );
}
