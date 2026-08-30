// src/components/SentenceBuilder.tsx
// 홈의 전부. 팀이 정한 3단계(카테고리 → 서브카테고리 → 포맷)를 그대로 두고,
// 화면 세 군데에 흩어놓는 대신 문장 하나의 빈칸 셋으로 모았습니다.

"use client";

import { useMemo, useState } from "react";
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

  // 개수는 서버가 계산합니다. 포맷/시간을 바꾸면 주제별 숫자도 같이 바뀝니다.
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
        padding: "clamp(48px, 8vw, 92px) clamp(16px, 4vw, 56px) 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: CONTENT_WIDTH - 100,
          display: "flex",
          flexDirection: "column",
          gap: 44,
        }}
      >
        {/* ---------------- 문장 (모바일 최적화 정렬) ---------------- */}
        <div
          style={{
            fontFamily: font.display,
            fontWeight: 300,
            fontSize: "clamp(22px, 5.2vw, 42px)",
            lineHeight: 1.5,
            letterSpacing: "-0.015em",
            color: c.ink,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px 10px",
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
          <div style={{ position: "relative", display: "inline-block" }}>
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
          <div style={{ position: "relative", display: "inline-block" }}>
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

        {/* 주제 피커는 팝오버가 아니라 문장 아래 패널로 엽니다 — 84개를 담아야 하니까 */}
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

        {/* ---------------- 행동 ---------------- */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <button
            type="button"
            onClick={() => go(draft)}
            style={{
              ...primaryButton,
              padding: "16px 34px",
              fontSize: 16.5,
            }}
          >
            Show me the rooms
          </button>
          <span style={{ fontFamily: font.ui, fontSize: 14.5, color: c.ink3 }}>
            {resultHint ?? "Free · no account needed to look"}
          </span>
        </div>

        {/* ---------------- 빠른 진입 ---------------- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            paddingTop: 8,
          }}
        >
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 10.5,
              letterSpacing: "0.14em",
              color: c.ink3,
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
                  fontSize: 14.5,
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