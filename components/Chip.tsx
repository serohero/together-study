// src/components/Chip.tsx
// 문장 안의 빈칸. 이 하나가 v3의 상단 탭 + 좌측 레일 + 필터 드롭다운을 대신합니다.

"use client";

import { forwardRef } from "react";
import { c, font, resetButton } from "./tokens";

export interface ChipProps {
  label: string;
  /** 값이 정해졌는지 (정해지면 초록, 아니면 회색) */
  filled: boolean;
  open: boolean;
  onClick: () => void;
  /** hero = 홈의 46px 문장, compact = 결과 화면의 16px 칩 */
  size?: "hero" | "compact";
  ariaLabel: string;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { label, filled, open, onClick, size = "hero", ariaLabel },
  ref
) {
  const hero = size === "hero";
  const bg = filled ? c.accentTint : c.neutralTint;
  const fg = filled ? c.accent : c.ink2;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={ariaLabel}
      style={{
        ...resetButton,
        display: "inline-flex",
        alignItems: hero ? "baseline" : "center",
        gap: hero ? 10 : 8,
        background: open ? c.accent : bg,
        color: open ? "#FFFFFF" : fg,
        borderRadius: hero ? 6 : 7,
        padding: hero ? "1px 14px 4px" : "9px 16px",
        margin: hero ? "0 4px" : 0,
        fontFamily: hero ? font.display : font.ui,
        fontWeight: hero ? 400 : 600,
        fontSize: hero ? "inherit" : 16,
        lineHeight: hero ? 1.18 : 1.2,
        transition: "background 140ms ease, color 140ms ease",
      }}
    >
      {label}
      <svg
        width={hero ? 14 : 13}
        height={hero ? 14 : 13}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{
          alignSelf: "center",
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 140ms ease",
        }}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
});
