// src/components/TopicPicker.tsx
// 주제 피커. 왼쪽에 카테고리, 오른쪽에 그 카테고리의 서브카테고리.
// 검색어를 치면 전체 토픽에서 바로 찾습니다.
// 목록은 real `categories` 테이블(layer_1/layer_2)에서 불러옵니다 — useCategories 훅.
// 숫자는 지금 고른 포맷·시간 기준으로 서버에서 다시 계산된 값입니다.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useCategories } from "@/hooks/useCategories";
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
  isMobile?: boolean;
}

export function TopicPicker({
  open,
  onClose,
  onPick,
  selectedId,
  counts,
  loading,
  isMobile = false,
}: Props) {
  const { categories, loading: categoriesLoading } = useCategories();
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [term, setTerm] = useState("");

  const ref = useDismissable<HTMLDivElement>(open, onClose, { focusOnOpen: true });

  // 카테고리 목록이 (비동기로) 도착하면 그때 활성 카테고리를 정한다.
  useEffect(() => {
    if (categories.length === 0) return;
    setActiveCategoryId((current) => {
      if (current && categories.some((cat) => cat.id === current)) return current;
      const owner = categories.find((cat) =>
        cat.subcategories.some((s) => s.id === selectedId)
      );
      return owner ? owner.id : categories[0].id;
    });
  }, [categories, selectedId]);

  const searching = term.trim().length > 0;
  const allSubcategories = useMemo(
    () => categories.flatMap((cat) => cat.subcategories),
    [categories]
  );
  const results = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return [];
    return allSubcategories
      .filter((s) => {
        const owner = categories.find((cat) => cat.id === s.categoryId);
        return (
          s.label.toLowerCase().includes(q) ||
          (owner ? owner.label.toLowerCase().includes(q) : false)
        );
      })
      .slice(0, 40);
  }, [term, allSubcategories, categories]);
  const activeCategory =
    categories.find((x) => x.id === activeCategoryId) ?? categories[0] ?? null;

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
      {/* 검색 — 목록을 다 클릭하지 않아도 되게 하는 탈출구 */}
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
              Nothing matches “{term}”. Try a broader word, or tell us what is
              missing.
            </p>
          ) : (
            results.map((s) => {
              const n = countFor(s.id);
              const owner = categories.find((x) => x.id === s.categoryId);
              return (
                <button
                  key={`${s.categoryId}::${s.id}`}
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
      ) : categories.length === 0 || !activeCategory ? (
        <div
          style={{
            padding: "36px 22px",
            fontFamily: font.ui,
            fontSize: 14.5,
            color: c.ink3,
          }}
        >
          {categoriesLoading ? "Loading topics…" : "Couldn’t load topics right now."}
        </div>
      ) : (
        <div
          style={
            isMobile
              ? { display: "flex", flexDirection: "column", maxHeight: "70vh" }
              : { display: "grid", gridTemplateColumns: "268px minmax(0, 1fr)" }
          }
        >
          {/* 카테고리 7개 — 모바일에서는 가로 스크롤 칩으로 */}
          <div
            style={
              isMobile
                ? {
                    display: "flex",
                    gap: 8,
                    overflowX: "auto",
                    padding: "12px 16px",
                    borderBottom: `1px solid ${c.hairSoft}`,
                    flexShrink: 0,
                    WebkitOverflowScrolling: "touch",
                  }
                : {
                    borderRight: `1px solid ${c.hairSoft}`,
                    padding: "14px 12px 18px",
                  }
            }
          >
            {!isMobile && (
              <span style={{ ...labelStyle, display: "block", padding: "6px 14px 10px" }}>
                Field
              </span>
            )}
            {categories.map((cat) => {
              const active = cat.id === activeCategory.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => setActiveCategoryId(cat.id)}
                  onFocus={() => setActiveCategoryId(cat.id)}
                  onClick={() => setActiveCategoryId(cat.id)}
                  aria-current={active}
                  style={
                    isMobile
                      ? {
                          ...resetButton,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 13px",
                          borderRadius: 999,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          background: active ? c.accentTint2 : c.neutralTint,
                        }
                      : {
                          ...resetButton,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "11px 14px",
                          borderRadius: 7,
                          marginBottom: 1,
                          background: active ? c.accentTint2 : "transparent",
                        }
                  }
                >
                  <span
                    style={{
                      fontFamily: font.ui,
                      fontSize: isMobile ? 13.5 : 15,
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
          <div
            style={
              isMobile
                ? { padding: "12px 16px 18px", overflowY: "auto" }
                : { padding: "14px 22px 18px" }
            }
          >
            <span style={{ ...labelStyle, display: "block", padding: "6px 12px 10px" }}>
              {activeCategory.label} — {activeCategory.subcategories.length} topics
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                gap: "0 20px",
              }}
            >
              {activeCategory.subcategories.map((s) => {
                const n = countFor(s.id);
                const selected = s.id === selectedId;
                return (
                  <button
                    key={`${s.categoryId}::${s.id}`}
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
