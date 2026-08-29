// src/app/explore/page.tsx
// 결과 화면. 상태의 진실은 URL에 있습니다 (?topic=…&format=…&day=…&when=…).
// 칩을 누르면 URL이 바뀌고, URL이 바뀌면 데이터가 다시 불러와집니다.

"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Chip } from "@/components/Chip";
import { TopicPicker } from "@/components/TopicPicker";
import { FormatPicker } from "@/components/FormatPicker";
import { TimePicker } from "@/components/TimePicker";
import { RoomCard } from "@/components/RoomCard";
import { useRooms } from "@/hooks/useRoomData";
import { getSubcategory } from "@/lib/taxonomy";
import {
  EMPTY_QUERY,
  formatLabel,
  parseQuery,
  serializeQuery,
  timeLabel,
  topicLabel,
} from "@/lib/query";
import { isLive } from "@/lib/rooms";
import type {
  DaypartId,
  FormatId,
  SearchQuery,
  Subcategory,
  Weekday,
} from "@/lib/types";
import { c, font, resetButton, CONTENT_WIDTH } from "@/components/tokens";

type OpenPicker = "topic" | "format" | "time" | null;

function ExploreInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState<OpenPicker>(null);

  const query = useMemo(() => parseQuery(params), [params]);
  const { data, loading, error } = useRooms(query);

  const timeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "your time";
    } catch {
      return "your time";
    }
  }, []);

  const apply = useCallback(
    (next: SearchQuery) => {
      const qs = serializeQuery(next);
      router.replace(qs ? `/explore?${qs}` : "/explore", { scroll: false });
    },
    [router]
  );

  function pickTopic(sub: Subcategory) {
    apply({ ...query, subcategoryId: sub.id, categoryId: sub.categoryId });
    setOpen(null);
  }
  function pickFormat(format: FormatId | null) {
    apply({ ...query, format });
    setOpen(null);
  }
  function pickTime(next: { weekday: Weekday | null; daypart: DaypartId | null }) {
    apply({ ...query, weekday: next.weekday, daypart: next.daypart });
  }

  const sub = getSubcategory(query.subcategoryId);
  const rooms = data?.rooms ?? [];
  const total = data?.total ?? 0;
  const withSeats = rooms.filter((r) => r.seatsTaken < r.seatsTotal).length;
  const now = new Date();

  return (
    <main style={{ background: c.ground, minHeight: "100vh" }}>
      <SiteHeader compact />

      <div
        style={{
          padding: "26px 56px 64px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: CONTENT_WIDTH,
            display: "flex",
            flexDirection: "column",
            gap: 30,
          }}
        >
          {/* ---- 문장이 칩 세 개로 줄어든 형태 ---- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                flexWrap: "wrap",
              }}
            >
              <span style={{ position: "relative", display: "inline-block" }}>
                <Chip
                  size="compact"
                  label={topicLabel(query)}
                  filled={Boolean(sub)}
                  open={open === "topic"}
                  onClick={() => setOpen(open === "topic" ? null : "topic")}
                  ariaLabel={`Topic: ${topicLabel(query)}`}
                />
              </span>
              <span style={{ position: "relative", display: "inline-block" }}>
                <Chip
                  size="compact"
                  label={formatLabel(query)}
                  filled={query.format !== null}
                  open={open === "format"}
                  onClick={() => setOpen(open === "format" ? null : "format")}
                  ariaLabel={`Format: ${formatLabel(query)}`}
                />
                <FormatPicker
                  open={open === "format"}
                  onClose={() => setOpen(null)}
                  onPick={pickFormat}
                  selected={query.format}
                  counts={data?.counts ?? null}
                />
              </span>
              <span style={{ position: "relative", display: "inline-block" }}>
                <Chip
                  size="compact"
                  label={timeLabel(query)}
                  filled={query.weekday !== null || query.daypart !== null}
                  open={open === "time"}
                  onClick={() => setOpen(open === "time" ? null : "time")}
                  ariaLabel={`Time: ${timeLabel(query)}`}
                />
                <TimePicker
                  open={open === "time"}
                  onClose={() => setOpen(null)}
                  weekday={query.weekday}
                  daypart={query.daypart}
                  onChange={pickTime}
                  timeZone={timeZone}
                />
              </span>
              <button
                type="button"
                onClick={() => apply(EMPTY_QUERY)}
                style={{
                  ...resetButton,
                  marginLeft: 6,
                  fontFamily: font.ui,
                  fontSize: 14,
                  color: c.ink3,
                }}
              >
                Start over
              </button>
            </div>

            {open === "topic" && (
              <TopicPicker
                open
                onClose={() => setOpen(null)}
                onPick={pickTopic}
                selectedId={query.subcategoryId}
                counts={data?.counts ?? null}
                loading={loading}
              />
            )}

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontFamily: font.ui, fontSize: 15, color: c.ink2 }}>
                {loading ? (
                  <span style={{ color: c.ink3 }}>Looking…</span>
                ) : error ? (
                  <span style={{ color: c.live }}>
                    Could not load rooms. Refresh and it should come back.
                  </span>
                ) : (
                  <>
                    <strong style={{ color: c.ink, fontWeight: 600 }}>
                      {total} room{total === 1 ? "" : "s"}
                    </strong>{" "}
                    match.{" "}
                    {total === 0
                      ? ""
                      : withSeats > 0
                        ? `${withSeats} of the ones below have seats open.`
                        : "None of these have seats right now."}
                  </>
                )}
              </span>
            </div>

            {/* 탭을 지운 자리 — 다른 포맷은 조용한 한 줄로 남깁니다 */}
            {data && data.counts.siblingFormats.length > 0 && sub && (
              <div style={{ fontFamily: font.ui, fontSize: 14, color: c.ink3 }}>
                Also in {sub.label} —{" "}
                {data.counts.siblingFormats.map((f, i) => (
                  <span key={f.format}>
                    {i > 0 && " · "}
                    <button
                      type="button"
                      onClick={() => apply({ ...query, format: f.format })}
                      style={{ ...resetButton, color: c.accent }}
                    >
                      {f.label} {f.count}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ---- 방 — 화면에서 유일하게 큰 것 ---- */}
          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 20,
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 210,
                    borderRadius: 11,
                    background: "#F2F4F1",
                  }}
                />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <EmptyState query={query} onApply={apply} />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 20,
              }}
            >
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} isLive={isLive(room, now)} />
              ))}
            </div>
          )}

          {!loading && rooms.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                paddingTop: 6,
                fontFamily: font.ui,
                fontSize: 14.5,
                color: c.ink3,
              }}
            >
              <span>
                That is every room matching {topicLabel(query)} · {formatLabel(query)}{" "}
                · {timeLabel(query)}.
              </span>
              <Link href="/rooms/new" prefetch={false} style={{ color: c.accent, textDecoration: "none" }}>
                Start your own
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/** 빈 조합은 막다른 길이 아니라 출구 세 개를 줍니다. */
function EmptyState({
  query,
  onApply,
}: {
  query: SearchQuery;
  onApply: (q: SearchQuery) => void;
}) {
  const sub = getSubcategory(query.subcategoryId);
  return (
    <div
      style={{
        border: "1px dashed #C7D0C9",
        background: "#FBFCFA",
        borderRadius: 11,
        padding: "34px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: font.display,
          fontWeight: 400,
          fontSize: 26,
          color: c.ink,
        }}
      >
        Nobody has opened this one yet.
      </h2>
      <p style={{ margin: 0, fontFamily: font.ui, fontSize: 15, color: c.ink2 }}>
        Three ways forward, in the order that usually works:
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {query.format && (
          <button
            type="button"
            onClick={() => onApply({ ...query, format: null })}
            style={{ ...resetButton, fontFamily: font.ui, fontSize: 15, color: c.accent }}
          >
            → Same topic, any format
          </button>
        )}
        {(query.weekday !== null || query.daypart !== null) && (
          <button
            type="button"
            onClick={() => onApply({ ...query, weekday: null, daypart: null })}
            style={{ ...resetButton, fontFamily: font.ui, fontSize: 15, color: c.accent }}
          >
            → Same topic, any hour
          </button>
        )}
        <Link
          href="/rooms/new"
          prefetch={false}
          style={{
            fontFamily: font.ui,
            fontSize: 15,
            color: c.wait,
            textDecoration: "none",
          }}
        >
          → Start the first {sub ? sub.label : ""} room here
        </Link>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<main style={{ background: c.ground, minHeight: "100vh" }} />}>
      <ExploreInner />
    </Suspense>
  );
}
