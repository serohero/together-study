// src/components/TopicPicker.tsx
// 주제 피커. 왼쪽에 카테고리 7개, 오른쪽에 그 카테고리의 서브카테고리.
// 검색어를 치면 전체 84개에서 바로 찾습니다.
// 숫자는 지금 고른 포맷·시간 기준으로 서버에서 다시 계산된 값입니다.

"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, searchSubcategories } from "@/lib/taxonomy";
import type { Subcategory, TaxonomyCounts } from "@/lib/types";
import { useDismissable } from "@/hooks/useDismissable";
import { c, font, label as labelStyle, resetButton, shadow } from "./tokens";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (sub: Subcategory) => void;
  selectedId: string | null;
  counts: TaxonomyCounts | null;
  loading: boolean;
}

export function TopicPicker({
  open,
  onClose,
  onPick,
  selectedId,
  counts,
  loading,
}: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(() => {
    const owner = CATEGORIES.find((cat) =>
      cat.subcategories.some((s) => s.id === selectedId)
    );
    return owner ? owner.id : CATEGORIES[0].id;
  });
  const [term, setTerm] = useState("");

  const ref = useDismissable<HTMLDivElement>(open, onClose, { focusOnOpen: true });

  const searching = term.trim().length > 0;
  const results = useMemo(() => searchSubcategories(term), [term]);
  const activeCategory =
    CATEGORIES.find((x) => x.id === activeCategoryId) ?? CATEGORIES[0];

  if (!open) return null;

  const countFor = (id: string) => counts?.bySubcategory[id] ?? 0;
  const catCountFor = (id: string) => counts?.byCategory[id] ?? 0;

  function pick(sub: Subcategory) {
    onPick(sub);
    setTerm("");
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Pick a topic"
      style={{
        background: c.card,
        borderRadius: 12,
        boxShadow: shadow.panel,
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* 검색 — 84개를 다 클릭하지 않아도 되게 하는 탈출구 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          padding: "16px 22px",
          borderBottom: `1px solid ${c.hairSoft}`,
        }}
      >
        <svg
          width={19}
          height={19}
          viewBox="0 0 24 24"
          fill="none"
          stroke={c.ink3}
          strokeWidth={1.8}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M16.5 16.5L21 21" />
        </svg>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder='Type what you are studying — "MCAT", "Korean", "system design"'
          aria-label="Search topics"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: font.ui,
            fontSize: 16.5,
            color: c.ink,
          }}
        />
        {loading ? (
          <span style={{ ...labelStyle, fontSize: 10 }}>updating…</span>
        ) : (
          <kbd
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              color: c.ink4,
              border: `1px solid ${c.hair}`,
              borderRadius: 4,
              padding: "3px 8px",
            }}
          >
            ESC
          </kbd>
        )}
      </div>

      {searching ? (
        <div style={{ padding: "12px 14px 16px", maxHeight: 380, overflowY: "auto" }}>
          {results.length === 0 ? (
            <p
              style={{
                margin: 0,
                padding: "22px 12px",
                fontFamily: font.ui,
                fontSize: 15,
                color: c.ink3,
              }}
            >
              Nothing matches “{term}”. Roundtable covers 84 topics — try a broader
              word, or tell us what is missing.
            </p>
          ) : (
            results.map((s) => {
              const n = countFor(s.id);
              const owner = CATEGORIES.find((x) => x.id === s.categoryId);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(s)}
                  style={{
                    ...resetButton,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 7,
                    background: s.id === selectedId ? c.accentTint : "transparent",
                  }}
                >
                  <span style={{ fontFamily: font.ui, fontSize: 15, color: c.ink }}>
                    {s.label}
                    <span style={{ color: c.ink4 }}> · {owner?.label}</span>
                  </span>
                  <span
                    style={{
                      fontFamily: font.mono,
                      fontSize: 12,
                      color: n > 0 ? c.ink3 : c.ink4,
                    }}
                  >
                    {n > 0 ? n : "—"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "268px minmax(0, 1fr)" }}>
          {/* 카테고리 7개 */}
          <div
            style={{
              borderRight: `1px solid ${c.hairSoft}`,
              padding: "14px 12px 18px",
            }}
          >
            <span style={{ ...labelStyle, display: "block", padding: "6px 14px 10px" }}>
              Field
            </span>
            {CATEGORIES.map((cat) => {
              const active = cat.id === activeCategory.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => setActiveCategoryId(cat.id)}
                  onFocus={() => setActiveCategoryId(cat.id)}
                  onClick={() => setActiveCategoryId(cat.id)}
                  aria-current={active}
                  style={{
                    ...resetButton,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 7,
                    marginBottom: 1,
                    background: active ? c.accentTint2 : "transparent",
                  }}
                >
                  <span
                    style={{
                      fontFamily: font.ui,
                      fontSize: 15,
                      color: c.ink,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {cat.label}
                  </span>
                  <span
                    style={{
                      fontFamily: font.mono,
                      fontSize: 12,
                      color: active ? c.accent : c.ink4,
                    }}
                  >
                    {catCountFor(cat.id)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 서브카테고리 */}
          <div style={{ padding: "14px 22px 18px" }}>
            <span style={{ ...labelStyle, display: "block", padding: "6px 12px 10px" }}>
              {activeCategory.label} — {activeCategory.subcategories.length} topics
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0 20px",
              }}
            >
              {activeCategory.subcategories.map((s) => {
                const n = countFor(s.id);
                const selected = s.id === selectedId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pick(s)}
                    style={{
                      ...resetButton,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "11px 12px",
                      borderRadius: 7,
                      background: selected ? c.accentTint : "transparent",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: font.ui,
                        fontSize: 15,
                        color: n > 0 ? (selected ? c.accent : c.ink) : c.ink4,
                        fontWeight: selected ? 600 : 400,
                      }}
                    >
                      {s.label}
                    </span>
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 12,
                        color: n > 0 ? (selected ? c.accent : c.ink4) : "#CDD5CF",
                      }}
                    >
                      {n > 0 ? n : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          borderTop: `1px solid ${c.hairSoft}`,
          padding: "14px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#FCFDFC",
        }}
      >
        <span style={{ fontFamily: font.ui, fontSize: 13.5, color: c.ink3 }}>
          Numbers are rooms running now. A dash means nobody has started one yet —
          you can.
        </span>
      </div>
    </div>
  );
}
