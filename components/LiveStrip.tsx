// src/components/LiveStrip.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLiveRooms } from "@/hooks/useRoomData";
import { c, font, CONTENT_WIDTH } from "./tokens";

export function LiveStrip() {
  const { data, loading } = useLiveRooms(60000);
  const [tick, setTick] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 화면 폭 감지 (768px 기준)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 60000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <section
      style={{
        padding: isMobile ? "40px 16px 48px" : "68px 56px 60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: CONTENT_WIDTH - 100,
          borderTop: `1px solid ${c.hair}`,
          paddingTop: isMobile ? 22 : 30,
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 16 : 20,
          boxSizing: "border-box",
        }}
      >
        {/* 헤더 안내 영역 (모바일 flex-wrap 대응) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px 14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="live-dot"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: c.live,
                display: "block",
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            <p
              style={{
                margin: 0,
                fontFamily: font.ui,
                fontSize: isMobile ? 14 : 15,
                color: c.ink,
              }}
            >
              {loading || !data ? (
                <span style={{ color: c.ink3 }}>Checking what is on right now…</span>
              ) : (
                <>
                  <strong style={{ fontWeight: 600 }}>{data.count} rooms</strong> are
                  meeting right now.
                </>
              )}
            </p>
          </div>

          <Link
            href="/explore"
            prefetch={false}
            style={{
              fontFamily: font.ui,
              fontSize: isMobile ? 13.5 : 14.5,
              color: c.accent,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            See what&apos;s on →
          </Link>
        </div>

        {/* 방 목록 카드 그리드 (모바일에서는 1~2열 자동 배치) */}
        <div
          style={{
            display: "grid",
            // 모바일 폭에서는 최소 160px~1fr로 감싸서 1~2열, PC에서는 4열로 자연스럽게 전환
            gridTemplateColumns: isMobile
              ? "repeat(auto-fill, minmax(150px, 1fr))"
              : "repeat(4, minmax(0, 1fr))",
            gap: isMobile ? 20 : 34,
            minHeight: 68,
            boxSizing: "border-box",
          }}
        >
          {(data?.rooms ?? []).map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 5,
                minWidth: 0, // 텍스트 말줄임 및 줄바꿈 보장
              }}
            >
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 10.5,
                  color: c.live,
                  letterSpacing: "0.06em",
                }}
              >
                {r.minutesIn + tick} MIN IN
              </span>
              <span
                style={{
                  fontFamily: font.ui,
                  fontSize: isMobile ? 14 : 15,
                  fontWeight: 500,
                  color: c.ink,
                  lineHeight: 1.35,
                  wordBreak: "break-word",
                }}
              >
                {r.title}
              </span>
              <span
                style={{
                  fontFamily: font.ui,
                  fontSize: isMobile ? 12 : 13,
                  color: c.ink3,
                  lineHeight: 1.3,
                }}
              >
                {r.peopleHere} people · week {r.weekCurrent} of {r.weeksTotal}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}