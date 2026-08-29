// src/components/LiveStrip.tsx
// "지금 31개 방이 모이는 중" — API에서 받아오고, 경과 시간은 1분마다 올라갑니다.
// 홈에서 문장 다음으로 유일하게 존재하는 요소입니다.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLiveRooms } from "@/hooks/useRoomData";
import { c, font, CONTENT_WIDTH } from "./tokens";

export function LiveStrip() {
  const { data, loading } = useLiveRooms(60000);
  // 폴링 사이에도 분이 흐르게 로컬 카운터를 하나 둡니다.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 60000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <section
      style={{
        padding: "68px 56px 60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: CONTENT_WIDTH - 100,
          borderTop: `1px solid ${c.hair}`,
          paddingTop: 30,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span
            className="live-dot"
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: c.live,
              display: "block",
            }}
            aria-hidden="true"
          />
          <p style={{ margin: 0, fontFamily: font.ui, fontSize: 15, color: c.ink }}>
            {loading || !data ? (
              <span style={{ color: c.ink3 }}>Checking what is on right now…</span>
            ) : (
              <>
                <strong style={{ fontWeight: 600 }}>{data.count} rooms</strong> are
                meeting right now.
              </>
            )}
          </p>
          <Link
            href="/explore"
            style={{
              marginLeft: "auto",
              fontFamily: font.ui,
              fontSize: 14.5,
              color: c.accent,
              textDecoration: "none",
            }}
          >
            See what&apos;s on →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 34,
            minHeight: 68,
          }}
        >
          {(data?.rooms ?? []).map((r) => (
            <div
              key={r.id}
              style={{ display: "flex", flexDirection: "column", gap: 5 }}
            >
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 11,
                  color: c.live,
                  letterSpacing: "0.06em",
                }}
              >
                {r.minutesIn + tick} MIN IN
              </span>
              <span
                style={{
                  fontFamily: font.ui,
                  fontSize: 15,
                  color: c.ink,
                  lineHeight: 1.35,
                }}
              >
                {r.title}
              </span>
              <span style={{ fontFamily: font.ui, fontSize: 13, color: c.ink3 }}>
                {r.peopleHere} people · week {r.weekCurrent} of {r.weeksTotal}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
