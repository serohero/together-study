// src/components/FormatPicker.tsx
// 포맷 팝오버. 실제 study_types 테이블 + "any format". 개수는 지금 고른 주제·시간 기준입니다.
// 목록은 real `study_types` 테이블에서 불러옵니다 — useFormats 훅.

"use client";

import { useFormats } from "@/hooks/useFormats";
import type { FormatId, TaxonomyCounts } from "@/lib/types";
import { useDismissable } from "@/hooks/useDismissable";
import { c, font, label as labelStyle, resetButton, shadow } from "./tokens";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (format: FormatId | null) => void;
  selected: FormatId | null;
  counts: TaxonomyCounts | null;
  isMobile?: boolean;
}

export function FormatPicker({
  open,
  onClose,
  onPick,
  selected,
  counts,
  isMobile = false,
}: Props) {
  const ref = useDismissable<HTMLDivElement>(open, onClose, { focusOnOpen: true });
  const { formats, loading: formatsLoading } = useFormats();
  if (!open) return null;

  const rows: { id: FormatId | null; label: string; blurb: string; n: number | null }[] =
    [
      { id: null, label: "Any format", blurb: "Show me everything", n: null },
      ...formats.map((f) => ({
        id: f.id as FormatId | null,
        label: f.label,
        blurb: f.blurb,
        n: counts ? counts.byFormat[f.id] : null,
      })),
    ];

  return (
    <>
      {isMobile && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20, 24, 21, 0.28)",
            zIndex: 45,
          }}
        />
      )}
      <div
        ref={ref}
        role="dialog"
        aria-label="Pick a format"
        style={
          isMobile
            ? {
                position: "fixed",
                zIndex: 46,
                left: 16,
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                maxHeight: "76vh",
                overflowY: "auto",
                background: c.card,
                borderRadius: 11,
                boxShadow: shadow.popover,
                padding: "12px 10px",
              }
            : {
                position: "absolute",
                zIndex: 40,
                top: "calc(100% + 10px)",
                left: 0,
                width: 340,
                background: c.card,
                borderRadius: 11,
                boxShadow: shadow.popover,
                padding: "12px 10px",
              }
        }
      >
        <span style={{ ...labelStyle, display: "block", padding: "4px 12px 8px" }}>
          Format
        </span>
      {formatsLoading && formats.length === 0 && (
        <span
          style={{
            display: "block",
            padding: "10px 12px",
            fontFamily: font.ui,
            fontSize: 13.5,
            color: c.ink3,
          }}
        >
          Loading formats…
        </span>
      )}
      {rows.map((r) => {
        const active = r.id === selected;
        const empty = r.n === 0;
        return (
          <button
            key={r.id ?? "any"}
            type="button"
            onClick={() => onPick(r.id)}
            style={{
              ...resetButton,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 7,
              background: active ? c.accentTint : "transparent",
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontFamily: font.ui,
                  fontSize: 15,
                  fontWeight: active ? 600 : 400,
                  color: empty ? c.ink4 : active ? c.accent : c.ink,
                }}
              >
                {r.label}
              </span>
              <span style={{ fontFamily: font.ui, fontSize: 12.5, color: c.ink3 }}>
                {r.blurb}
              </span>
            </span>
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 12,
                color: active ? c.accent : c.ink4,
              }}
            >
              {r.n === null ? "" : r.n > 0 ? r.n : "—"}
            </span>
          </button>
        );
      })}
      </div>
    </>
  );
}
