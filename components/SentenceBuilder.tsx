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
import { FORMATS, DAYPARTS } from "@/lib/types";
import type {
  DaypartId,
  FormatId,
  SearchQuery,
  Subcategory,
  Weekday,
} from "@/lib/types";
import { c, font, primaryButton, CONTENT_WIDTH } from "./tokens";

type OpenPicker = "topic" | "format" | "time" | null;

// 히어로 문장의 빈 칩(아직 아무것도 안 고른 상태)에서 살짝 도는 예시 값들.
// 드롭다운이 닫혀 있고 그 항목을 아직 아무것도 안 골랐을 때만 돌고,
// 열리거나 선택되는 즉시 실제 값 표시로 멈춘다.
const TOPIC_SAMPLES = [
  "MCAT",
  "LSAT",
  "Software Engineering",
  "Management Consulting",
  "Product Management",
  "Public Policy",
];
const FORMAT_SAMPLES = FORMATS.map((f) => f.label.toLowerCase());
const TIME_SAMPLES = DAYPARTS.map((d) => d.label.toLowerCase());
const CYCLE_INTERVAL_MS = 3000;
const CYCLE_FADE_MS = 180;

// 모바일에서 "I want to get better at [토픽칩]"이 항상 한 줄에 들어가도록,
// 토픽 값이 길어질수록 칩 폰트 크기를 줄인다 (through가 항상 2번째 줄에 오게 하기 위함).
// 8자까지는 원래 크기, 그 이후로는 글자당 조금씩 줄이고 0.56배 밑으로는 안 내려간다 (가독성 최소선).
function topicChipFontScale(text: string): number {
  const BASE_LEN = 8;
  const MIN_SCALE = 0.56;
  if (text.length <= BASE_LEN) return 1;
  const scale = 1 - (text.length - BASE_LEN) * 0.028;
  return Math.max(MIN_SCALE, scale);
}

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

  const sub = getSubcategory(draft.subcategoryId);

  // 아직 아무것도 안 고르고, 드롭다운도 닫혀 있는 칩만 실시간으로 예시 값을 돌린다.
  const topicLocked = Boolean(sub) || open === "topic";
  const formatLocked = draft.format !== null || open === "format";
  const timeLocked = draft.weekday !== null || draft.daypart !== null || open === "time";

  const [cycleTick, setCycleTick] = useState(0);
  const [cycleFading, setCycleFading] = useState(false);

  // 이동/스케일 같은 "동작"은 없고 텍스트 교체 + 옅은 opacity 딤(0.35)뿐이라
  // OS의 "동작 줄이기"가 켜져 있어도 순환 자체는 계속 돌린다 (내용이 멈추면 안 되니까).
  useEffect(() => {
    if (topicLocked && formatLocked && timeLocked) return;
    const timer = window.setInterval(() => {
      setCycleFading(true);
      window.setTimeout(() => {
        setCycleTick((n) => n + 1);
        setCycleFading(false);
      }, CYCLE_FADE_MS);
    }, CYCLE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [topicLocked, formatLocked, timeLocked]);

  const topicDisplay = topicLocked ? topicLabel(draft) : TOPIC_SAMPLES[cycleTick % TOPIC_SAMPLES.length];
  const formatDisplay = formatLocked ? formatLabel(draft) : FORMAT_SAMPLES[cycleTick % FORMAT_SAMPLES.length];
  const timeDisplay = timeLocked ? timeLabel(draft) : TIME_SAMPLES[cycleTick % TIME_SAMPLES.length];
  const topicChipScale = isMobile ? topicChipFontScale(topicDisplay) : 1;

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

  const resultHint =
    total === null
      ? null
      : total === 0
        ? "Nothing matches that yet — you would be the first to open one."
        : `${total} room${total === 1 ? "" : "s"} match so far`;

  return (
    <section
      style={{
        padding: isMobile
          ? "128px clamp(16px, 4vw, 56px) 0"
          : "clamp(52px, 9vw, 108px) clamp(16px, 4vw, 56px) 0",
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
          gap: isMobile ? 40 : 68,
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
          <span
            style={{
              display: "inline-flex",
              opacity: !topicLocked && cycleFading ? 0.35 : 1,
              transition: "opacity 180ms ease",
              transform: "translateZ(0)",
              fontSize: topicChipScale !== 1 ? `${topicChipScale}em` : undefined,
            }}
          >
            <Chip
              label={topicDisplay}
              filled
              open={open === "topic"}
              onClick={() => setOpen(open === "topic" ? null : "topic")}
              ariaLabel={`Topic: ${topicLabel(draft)}. Click to change.`}
            />
          </span>
          {isMobile && <div style={{ flexBasis: "100%", height: 0 }} />}
          <span>through</span>
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <span
              style={{
                display: "inline-flex",
                opacity: !formatLocked && cycleFading ? 0.35 : 1,
                transition: "opacity 180ms ease",
                transform: "translateZ(0)",
              }}
            >
              <Chip
                label={formatDisplay}
                filled
                open={open === "format"}
                onClick={() => setOpen(open === "format" ? null : "format")}
                ariaLabel={`Format: ${formatLabel(draft)}. Click to change.`}
              />
            </span>
            <FormatPicker
              open={open === "format"}
              onClose={() => setOpen(null)}
              onPick={pickFormat}
              selected={draft.format}
              counts={counts}
            />
          </div>
          <span>meeting</span>
          {isMobile && <div style={{ flexBasis: "100%", height: 0 }} />}
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <span
              style={{
                display: "inline-flex",
                opacity: !timeLocked && cycleFading ? 0.35 : 1,
                transition: "opacity 180ms ease",
                transform: "translateZ(0)",
              }}
            >
              <Chip
                label={timeDisplay}
                filled
                open={open === "time"}
                onClick={() => setOpen(open === "time" ? null : "time")}
                ariaLabel={`Time: ${timeLabel(draft)}. Click to change.`}
              />
            </span>
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
            gap: isMobile ? 14 : 22,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            onClick={() => go(draft)}
            className="rt-btn-primary"
            style={{
              ...primaryButton,
              padding: isMobile ? "12px 28px" : "16px 34px",
              fontSize: isMobile ? 15 : 16.5,
              width: "auto",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            Show me the rooms
          </button>
          <span
            className="rt-tnum"
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
      </div>
    </section>
  );
}