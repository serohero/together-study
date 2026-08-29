// src/components/TimePicker.tsx
// 시간 팝오버. 요일과 시간대를 한 화면에서 고릅니다.
// v3의 필터 드롭다운 4개(요일·시간대·타임존·좌석)가 여기 하나로 합쳐졌습니다.

"use client";

import { DAYPARTS, WEEKDAYS, type DaypartId, type Weekday } from "@/lib/types";
import { useDismissable } from "@/hooks/useDismissable";
import { c, font, label as labelStyle, resetButton, shadow } from "./tokens";

interface Props {
  open: boolean;
  onClose: () => void;
  weekday: Weekday | null;
  daypart: DaypartId | null;
  onChange: (next: { weekday: Weekday | null; daypart: DaypartId | null }) => void;
  /** 브라우저에서 읽은 타임존 이름. 표시용입니다. */
  timeZone: string;
}

export function TimePicker({
  open,
  onClose,
  weekday,
  daypart,
  onChange,
  timeZone,
}: Props) {
  const ref = useDismissable<HTMLDivElement>(open, onClose, { focusOnOpen: true });
  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Pick a time"
      style={{
        position: "absolute",
        zIndex: 40,
        top: "calc(100% + 10px)",
        left: 0,
        width: 372,
        background: c.card,
        borderRadius: 11,
        boxShadow: shadow.popover,
        padding: "14px 16px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "0 2px 10px",
        }}
      >
        <span style={labelStyle}>Which day</span>
        <span style={{ fontFamily: font.mono, fontSize: 10.5, color: c.ink4 }}>
          {timeZone}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
        {WEEKDAYS.map((d) => {
          const active = weekday === d.id;
          return (
            <button
              key={d.id}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange({ weekday: active ? null : d.id, daypart })
              }
              style={{
                ...resetButton,
                textAlign: "center",
                padding: "9px 0",
                borderRadius: 6,
                fontFamily: font.mono,
                fontSize: 12,
                background: active ? c.accent : c.neutralTint,
                color: active ? "#FFFFFF" : c.ink2,
              }}
            >
              {d.short}
            </button>
          );
        })}
      </div>

      <span style={{ ...labelStyle, display: "block", padding: "16px 2px 9px" }}>
        What sort of hour
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {DAYPARTS.map((p) => {
          const active = daypart === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange({ weekday, daypart: active ? null : p.id })
              }
              style={{
                ...resetButton,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: 7,
                background: active ? c.accentTint : "transparent",
              }}
            >
              <span
                style={{
                  fontFamily: font.ui,
                  fontSize: 15,
                  color: active ? c.accent : c.ink,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {p.label}
              </span>
              <span style={{ fontFamily: font.mono, fontSize: 11.5, color: c.ink4 }}>
                {p.hint}
              </span>
            </button>
          );
        })}
      </div>

      {(weekday !== null || daypart !== null) && (
        <button
          type="button"
          onClick={() => onChange({ weekday: null, daypart: null })}
          style={{
            ...resetButton,
            marginTop: 12,
            padding: "2px 2px",
            fontFamily: font.ui,
            fontSize: 13.5,
            color: c.ink3,
          }}
        >
          Any time works for me
        </button>
      )}
    </div>
  );
}
