// components/RoomEntry.tsx
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SiteHeader } from "./SiteHeader";
import { c, font, shadow, label } from "./tokens";

/* ---------- types ---------- */

// Matches the `study_rooms` table (id, leader_id, title, description, industry_1,
// industry_2, study_type, communication, location_type, location_city,
// schedule, current_members, max_members, contact_link, created_at).
// `session_number` is a GUESSED column name for the "which session in the
// series" count you're adding to the DB — rename it here and in the JSX
// below once the real column exists.
type RoomRow = {
  id: number;
  leader_id: string | null;
  title: string;
  description: string | null;
  industry_1: string | null;
  industry_2: string | null;
  study_type: string | null;
  location_type: string | null;
  location_city: string | null;
  schedule: string | null;
  current_members: number | null;
  max_members: number | null;
  session_number?: number | null;
};

/* ---------- schedule parsing ---------- */
// Reads strings like "Daily @ 9:00 PM" or "Every Wed @ 8:00 PM" and returns
// the next real Date they point to, in the visitor's local time. Returns
// `null` when the text doesn't match either shape — the screen then treats
// the room as already open rather than getting stuck locked forever.

const WEEKDAYS: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function timeOnDate(date: Date, hourStr: string, minuteStr: string, meridiem: string): Date {
  let hour = parseInt(hourStr, 10) % 12;
  if (meridiem.toLowerCase() === "pm") hour += 12;
  const next = new Date(date);
  next.setHours(hour, parseInt(minuteStr, 10), 0, 0);
  return next;
}

function nextScheduledDate(schedule: string | null): Date | null {
  if (!schedule) return null;
  const trimmed = schedule.trim();

  const dailyMatch = trimmed.match(/^daily\s*@\s*(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (dailyMatch) {
    const target = timeOnDate(new Date(), dailyMatch[1], dailyMatch[2], dailyMatch[3]);
    if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1);
    return target;
  }

  const weeklyMatch = trimmed.match(/^every\s+([a-z]+)\s*@\s*(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (weeklyMatch) {
    const dow = WEEKDAYS[weeklyMatch[1].toLowerCase()];
    if (dow === undefined) return null;
    const now = new Date();
    const daysAhead = (dow - now.getDay() + 7) % 7;
    let target = timeOnDate(addDays(now, daysAhead), weeklyMatch[2], weeklyMatch[3], weeklyMatch[4]);
    if (target.getTime() <= Date.now()) {
      target = timeOnDate(addDays(now, daysAhead + 7), weeklyMatch[2], weeklyMatch[3], weeklyMatch[4]);
    }
    return target;
  }

  return null;
}

function fmtCountdown(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/* ---------- component ---------- */

export default function RoomEntry({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("study_rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setRoom(data as RoomRow);
      setLoading(false);

      if (data.leader_id) {
        const { data: hostProfile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", data.leader_id)
          .maybeSingle();
        if (!cancelled) setHostName(hostProfile?.first_name || null);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const nextStart = useMemo(() => nextScheduledDate(room?.schedule ?? null), [room?.schedule]);

  useEffect(() => {
    if (!nextStart) {
      setRemaining(0);
      return;
    }
    function tick() {
      setRemaining(Math.max(0, Math.round((nextStart!.getTime() - Date.now()) / 1000)));
    }
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [nextStart]);

  if (loading) {
    return <main style={{ background: c.ground, minHeight: "100vh" }} />;
  }

  if (notFound || !room) {
    return (
      <main style={{ background: c.ground, minHeight: "100vh" }}>
        <SiteHeader compact />
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 20px" }}>
          <div style={{ textAlign: "center", fontFamily: font.ui, color: c.ink2 }}>
            <p style={{ fontFamily: font.display, fontSize: 24, color: c.ink, marginBottom: 8 }}>
              This room doesn&apos;t exist (anymore).
            </p>
            <p style={{ fontSize: 14.5 }}>It may have been closed, or the link is out of date.</p>
          </div>
        </div>
      </main>
    );
  }

  const unlocked = remaining !== null && remaining <= 0;
  const maxMembers = room.max_members ?? 0;
  const currentMembers = room.current_members ?? 0;

  const tags: { text: string; kind: "industry" | "type" | "loc" }[] = [];
  if (room.industry_1) tags.push({ text: room.industry_1, kind: "industry" });
  if (room.industry_2 && room.industry_2 !== room.industry_1) {
    tags.push({ text: room.industry_2, kind: "industry" });
  }
  if (room.study_type) tags.push({ text: room.study_type, kind: "type" });
  tags.push({
    text: room.location_type === "Online" ? "📍 Online" : `📍 ${room.location_city || "Onsite"}`,
    kind: "loc",
  });

  return (
    <main style={{ background: c.ground, minHeight: "100vh" }}>
      <style>{`
        @keyframes roomEntryPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20,107,78,0.35); }
          50% { box-shadow: 0 0 0 10px rgba(20,107,78,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .room-entry-btn.active { animation: none !important; }
        }
      `}</style>

      <SiteHeader compact />

      <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px 90px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            background: c.card,
            border: `1px solid ${c.hair}`,
            borderRadius: 20,
            boxShadow: shadow.panel,
            overflow: "hidden",
          }}
        >
          <div style={{ height: 5, width: "100%", background: c.accent }} />

          <div style={{ padding: "36px 40px 30px" }}>
            <p style={{ ...label, margin: "0 0 12px" }}>Room entry</p>

            <h1
              style={{
                margin: "0 0 12px",
                fontFamily: font.display,
                fontSize: 29,
                fontWeight: 650,
                lineHeight: 1.2,
                color: c.ink,
              }}
            >
              {room.title}
            </h1>

            {room.description && (
              <p
                style={{
                  margin: "0 0 20px",
                  fontFamily: font.ui,
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  color: c.ink2,
                }}
              >
                {room.description}
              </p>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}>
              {tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: font.ui,
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: 999,
                    background:
                      tag.kind === "industry" ? c.accentTint : tag.kind === "type" ? c.neutralTint : c.card,
                    color: tag.kind === "industry" ? c.accent : c.ink2,
                    border: tag.kind === "loc" ? `1px solid ${c.hair}` : "none",
                  }}
                >
                  {tag.text}
                </span>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "18px 20px",
                padding: "22px 0",
                borderTop: `1px dashed ${c.hair}`,
                borderBottom: `1px dashed ${c.hair}`,
                marginBottom: 26,
              }}
            >
              <Field label="Schedule" value={room.schedule || "Not set yet"} />
              <Field
                label="Members"
                value={
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {currentMembers} / {maxMembers}
                    {maxMembers > 0 && <SeatDots total={maxMembers} filled={currentMembers} />}
                  </span>
                }
              />
              <Field label="Host" value={hostName || "Not assigned yet"} muted={!hostName} />
              <Field
                label="Session"
                value={room.session_number ? `Session ${room.session_number}` : "Not set yet"}
                muted={!room.session_number}
              />
            </div>

            <div
              style={{
                fontFamily: font.mono,
                fontSize: 10.5,
                color: c.ink4,
                textAlign: "center",
                marginBottom: 22,
              }}
            >
              ROOM · #{room.id}
            </div>

            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div
                style={{
                  ...label,
                  marginBottom: 8,
                  color: unlocked ? c.accent : c.ink3,
                  transition: "color .3s ease",
                }}
              >
                {unlocked ? "Room is open" : "Starts in"}
              </div>
              <div
                style={{
                  fontFamily: font.mono,
                  fontSize: 52,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  color: c.ink,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {fmtCountdown(remaining ?? 0)}
              </div>
              <div style={{ marginTop: 8, fontFamily: font.ui, fontSize: 12.5, color: c.ink3 }}>
                {unlocked ? "Jump in whenever you're ready" : `${room.schedule || ""} · your time`}
              </div>
            </div>

            <button
              type="button"
              className={`room-entry-btn${unlocked ? " active" : ""}`}
              disabled={!unlocked}
              onClick={() => unlocked && router.push(`/study_room/${room.id}`)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                height: 54,
                borderRadius: 8,
                border: "none",
                fontFamily: font.ui,
                fontSize: 15.5,
                fontWeight: 700,
                cursor: unlocked ? "pointer" : "not-allowed",
                background: unlocked ? c.accent : c.neutralTint,
                color: unlocked ? "#fff" : c.ink3,
                transition: "background .3s ease, color .3s ease, box-shadow .3s ease",
                animation: unlocked ? "roomEntryPulse 2s ease-in-out infinite" : "none",
              }}
            >
              {unlocked ? "Enter Study Room →" : "Unlocks when the countdown ends"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------- small pieces ---------- */

function Field({
  label: labelText,
  value,
  muted,
}: {
  label: string;
  value: ReactNode;
  muted?: boolean;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontFamily: font.mono,
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: c.ink3,
          marginBottom: 5,
        }}
      >
        {labelText}
      </div>
      <div
        style={{
          fontFamily: font.ui,
          fontSize: 14.5,
          fontWeight: muted ? 400 : 500,
          color: muted ? c.ink3 : c.ink,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SeatDots({ total, filled }: { total: number; filled: number }) {
  const count = Math.min(total, 12);
  return (
    <span style={{ display: "flex", gap: 3 }} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: i < filled ? c.accent : c.hairSoft,
          }}
        />
      ))}
    </span>
  );
}
