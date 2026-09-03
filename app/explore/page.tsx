// src/app/explore/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { StudyRoomCard } from "@/components/StudyRoomCard";
import { supabase } from "@/lib/supabase";
import type { StudyRoomRow } from "@/lib/types";
import { c, font, resetButton, shadow, CONTENT_WIDTH } from "@/components/tokens";

const NOT_SET = "__not_set__";

function FilterDropdown({
  label,
  options,
  value,
  onChange,
  isMobile,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (next: string | null) => void;
  isMobile: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const display = value === null ? label : value === NOT_SET ? "Not categorized yet" : value;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...resetButton,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: value !== null ? c.accentTint : c.neutralTint,
          color: value !== null ? c.accent : c.ink2,
          borderRadius: 7,
          padding: isMobile ? "8px 12px" : "9px 16px",
          fontFamily: font.ui,
          fontWeight: 600,
          fontSize: isMobile ? 13.5 : 14.5,
          whiteSpace: "nowrap",
        }}
      >
        <span>{display}</span>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: 180,
            maxWidth: "calc(100vw - 32px)",
            background: c.card,
            border: `1px solid ${c.hair}`,
            borderRadius: 10,
            boxShadow: shadow.popover,
            overflow: "hidden",
            zIndex: 30,
          }}
        >
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            style={{
              ...resetButton,
              display: "block",
              width: "100%",
              padding: "10px 14px",
              fontFamily: font.ui,
              fontSize: 14,
              textAlign: "left",
              color: value === null ? c.accent : c.ink,
            }}
          >
            All
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              style={{
                ...resetButton,
                display: "block",
                width: "100%",
                padding: "10px 14px",
                textAlign: "left",
                borderTop: `1px solid ${c.hairSoft}`,
                fontFamily: font.ui,
                fontSize: 14,
                color: value === opt ? c.accent : c.ink,
                fontStyle: opt === NOT_SET ? "italic" : "normal",
              }}
            >
              {opt === NOT_SET ? "Not categorized yet" : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  const [rooms, setRooms] = useState<StudyRoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 너비 감지 (640px 이하)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("study_rooms")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setRooms((data as StudyRoomRow[]) ?? []);
        setError(null);
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const industries = useMemo(() => {
    const set = new Set<string>();
    let hasUnset = false;
    rooms.forEach((r) => {
      if (r.industry_1) set.add(r.industry_1);
      if (r.industry_2) set.add(r.industry_2);
      if (!r.industry_1 && !r.industry_2) hasUnset = true;
    });
    const list = Array.from(set).sort();
    return hasUnset ? [...list, NOT_SET] : list;
  }, [rooms]);

  const studyTypes = useMemo(() => {
    const set = new Set<string>();
    let hasUnset = false;
    rooms.forEach((r) => {
      if (r.study_type) set.add(r.study_type);
      else hasUnset = true;
    });
    const list = Array.from(set).sort();
    return hasUnset ? [...list, NOT_SET] : list;
  }, [rooms]);

  const filteredRooms = rooms.filter((r) => {
    if (industryFilter) {
      if (industryFilter === NOT_SET) {
        if (r.industry_1 || r.industry_2) return false;
      } else if (r.industry_1 !== industryFilter && r.industry_2 !== industryFilter) {
        return false;
      }
    }
    if (typeFilter) {
      if (typeFilter === NOT_SET) {
        if (r.study_type) return false;
      } else if (r.study_type !== typeFilter) {
        return false;
      }
    }
    return true;
  });

  const hasFilters = industryFilter !== null || typeFilter !== null;

  function clearFilters() {
    setIndustryFilter(null);
    setTypeFilter(null);
  }

  return (
    <main style={{ background: c.ground, minHeight: "100vh", overflowX: "hidden", width: "100%" }}>
      <SiteHeader compact />

      <div
        style={{
          padding: isMobile ? "20px 16px 48px" : "26px 56px 64px",
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
            maxWidth: CONTENT_WIDTH,
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 18 : 26,
            boxSizing: "border-box",
          }}
        >
          {/* 필터 영역 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            <FilterDropdown
              label="Topic"
              options={industries}
              value={industryFilter}
              onChange={setIndustryFilter}
              isMobile={isMobile}
            />
            <FilterDropdown
              label="Format"
              options={studyTypes}
              value={typeFilter}
              onChange={setTypeFilter}
              isMobile={isMobile}
            />
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  ...resetButton,
                  fontFamily: font.ui,
                  fontSize: 13.5,
                  color: c.ink3,
                  padding: "4px 8px",
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* 방 개수 안내 문구 */}
          <span style={{ fontFamily: font.ui, fontSize: isMobile ? 14 : 15, color: c.ink2 }}>
            {loading ? (
              <span style={{ color: c.ink3 }}>Looking…</span>
            ) : error ? (
              <span style={{ color: c.live }}>Could not load rooms. Refresh and it should come back.</span>
            ) : (
              <>
                <strong style={{ color: c.ink, fontWeight: 600 }}>{filteredRooms.length}</strong>{" "}
                room{filteredRooms.length === 1 ? "" : "s"}
                {hasFilters ? " match." : " open right now."}
              </>
            )}
          </span>

          {/* 방 목록 카드 렌더링 (모바일: 1열, 데스크톱: 2열) */}
          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                gap: 16,
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ height: 180, borderRadius: 11, background: "#F2F4F1" }} />
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div
              style={{
                border: "1px dashed #C7D0C9",
                background: "#FBFCFA",
                borderRadius: 11,
                padding: isMobile ? "24px 20px" : "34px 32px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxSizing: "border-box",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: font.display,
                  fontWeight: 400,
                  fontSize: isMobile ? 20 : 24,
                  color: c.ink,
                }}
              >
                {rooms.length === 0 ? "No rooms yet." : "Nothing matches these filters."}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontFamily: font.ui,
                  fontSize: isMobile ? 14 : 15,
                  color: c.ink2,
                  lineHeight: 1.4,
                }}
              >
                {rooms.length === 0 ? "Be the first to open one." : "Try clearing a filter, or start your own."}
              </p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    style={{ ...resetButton, fontFamily: font.ui, fontSize: 14.5, color: c.accent }}
                  >
                    → Clear filters
                  </button>
                )}
                <Link
                  href="/rooms/new"
                  prefetch={false}
                  style={{ fontFamily: font.ui, fontSize: 14.5, color: c.wait, textDecoration: "none" }}
                >
                  → Start a room
                </Link>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                gap: isMobile ? 16 : 20,
              }}
            >
              {filteredRooms.map((room) => (
                <StudyRoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}