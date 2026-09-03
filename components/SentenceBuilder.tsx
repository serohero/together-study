// src/components/SentenceBuilder.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Chip } from "./Chip";
import { TopicPicker } from "./TopicPicker";
import { FormatPicker } from "./FormatPicker";
import { TimePicker } from "./TimePicker";
import { useRoomCounts } from "@/hooks/useRoomData";
import { getSubcategory } from "@/lib/taxonomy";
import {
  EMPTY_QUERY,
  formatLabel,
  serializeQuery,
  timeLabel,
  topicLabel,
} from "@/lib/query";
import type {
  DaypartId,
  FormatId,
  SearchQuery,
  Subcategory,
  Weekday,
} from "@/lib/types";
import { c, font, primaryButton, resetButton, CONTENT_WIDTH } from "./tokens";

type OpenPicker = "topic" | "format" | "time" | null;

const QUICK_PICKS: { label: string; topic: string; format?: FormatId }[] = [
  { label: "MCAT", topic: "mcat" },
  { label: "Case interviews", topic: "management-consulting", format: "interview" },
  { label: "System design", topic: "software-engineering", format: "interview" },
  { label: "Korean", topic: "korean" },
  { label: "Morning writing", topic: "publishing-and-writing", format: "study" },
  { label: "LSAT", topic: "lsat" },
];

export function SentenceBuilder() {
  const router = useRouter();
  const [draft, setDraft] = useState<SearchQuery>(EMPTY_QUERY);
  const [open, setOpen] = useState<OpenPicker>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { counts, total, loading } = useRoomCounts(draft);

  const timeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "your time";
    } catch {
      return "your time";
    }
  }, []);

  function go(next: SearchQuery) {
    const qs = serializeQuery(next);
    router.push(qs ? `/explore?${qs}` : "/explore");
  }

  function pickTopic(sub: Subcategory) {
    setDraft((d) => ({
      ...d,
      subcategoryId: sub.id,
      categoryId: sub.categoryId,
    }));
    setOpen(null);
  }

  function pickFormat(format: FormatId | null) {
    setDraft((d) => ({ ...d, format }));
    setOpen(null);
  }

  function pickTime(next: { weekday: Weekday | null; daypart: DaypartId | null }) {
    setDraft((d) => ({ ...d, weekday: next.weekday, daypart: next.daypart }));
  }

  const sub = getSubcategory(draft.subcategoryId);
  const resultHint =
    total === null
      ? null
      : total === 0
        ? "Nothing matches that yet — you would be the first to open one."
        : `${total} room${total === 1 ? "" : "s"} match so far`;

  return (
    <section
      style={{
        padding: "clamp(36px, 7vw, 92px) clamp(16px, 4vw, 56px) 0",
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
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 32 : 44,
          boxSizing: "border-box",
        }}
      >
        {/* ---------------- 문장 (모바일 최적화 정렬) ---------------- */}
        <div
          style={{
            fontFamily: font.display,
            fontWeight: 300,
            fontSize: "clamp(20px, 5vw, 42px)",
            lineHeight: 1.6,
            letterSpacing: "-0.015em",
            color: c.ink,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px 10px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <span>I want to get better at</span>
          <Chip
            label={topicLabel(draft)}
            filled={Boolean(sub)}
            open={open === "topic"}
            onClick={() => setOpen(open === "topic" ? null : "topic")}
            ariaLabel={`Topic: ${topicLabel(draft)}. Click to change.`}
          />
          <span>through</span>
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <Chip
              label={formatLabel(draft)}
              filled={draft.format !== null}
              open={open === "format"}
              onClick={() => setOpen(open === "format" ? null : "format")}
              ariaLabel={`Format: ${formatLabel(draft)}. Click to change.`}
            />
            <FormatPicker
              open={open === "format"}
              onClose={() => setOpen(null)}
              onPick={pickFormat}
              selected={draft.format}
              counts={counts}
            />
          </div>
          <span>meeting</span>
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <Chip
              label={timeLabel(draft)}
              filled={draft.weekday !== null || draft.daypart !== null}
              open={open === "time"}
              onClick={() => setOpen(open === "time" ? null : "time")}
              ariaLabel={`Time: ${timeLabel(draft)}. Click to change.`}
            />
            <TimePicker
              open={open === "time"}
              onClose={() => setOpen(null)}
              weekday={draft.weekday}
              daypart={draft.daypart}
              onChange={pickTime}
              timeZone={timeZone}
            />
          </div>
          <span>every week.</span>
        </div>

        {/* 주제 피커 */}
        {open === "topic" && (
          <TopicPicker
            open
            onClose={() => setOpen(null)}
            onPick={pickTopic}
            selectedId={draft.subcategoryId}
            counts={counts}
            loading={loading}
          />
        )}

        {/* ---------------- 행동 (모바일 줄바꿈 & 너비 유동화) ---------------- */}
        <div
          style={{
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 12 : 22,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            onClick={() => go(draft)}
            style={{
              ...primaryButton,
              padding: isMobile ? "14px 24px" : "16px 34px",
              fontSize: isMobile ? 15 : 16.5,
              width: isMobile ? "100%" : "auto",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            Show me the rooms
          </button>
          <span
            style={{
              fontFamily: font.ui,
              fontSize: isMobile ? 13 : 14.5,
              color: c.ink3,
              lineHeight: 1.4,
            }}
          >
            {resultHint ?? "Free · no account needed to look"}
          </span>
        </div>

        {/* ---------------- 빠른 진입 ---------------- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "10px 12px" : 14,
            flexWrap: "wrap",
            paddingTop: 8,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 10.5,
              letterSpacing: "0.14em",
              color: c.ink3,
              width: isMobile ? "100%" : "auto",
              marginBottom: isMobile ? 2 : 0,
            }}
          >
            BUSY THIS WEEK
          </span>
          {QUICK_PICKS.map((q) => {
            const target = getSubcategory(q.topic);
            if (!target) return null;
            return (
              <button
                key={q.label}
                type="button"
                onClick={() =>
                  go({
                    ...EMPTY_QUERY,
                    subcategoryId: target.id,
                    categoryId: target.categoryId,
                    format: q.format ?? null,
                  })
                }
                style={{
                  ...resetButton,
                  fontFamily: font.ui,
                  fontSize: isMobile ? 13.5 : 14.5,
                  color: c.ink,
                  borderBottom: "1px solid #DDE3DC",
                  paddingBottom: 2,
                }}
              >
                {q.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}