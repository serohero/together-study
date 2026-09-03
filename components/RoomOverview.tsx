// components/RoomOverview.tsx
// "방 상세"(app/room_detail/[id])와 "방 입장 대기"(app/room_entry/[id]) 화면을
// variant prop 하나로 공유합니다. 레이아웃/데이터는 거의 동일하고 딱 두 군데만
// 다릅니다:
//   - variant="entry"일 때만 "Who's in the room" 섹션을 보여줍니다.
//   - 사이드바 버튼: detail은 "Claim a seat"(참여 신청), entry는 카운트다운이
//     끝나야 눌리는 "Room 입장"(study_room으로 이동) 버튼입니다.
//
// 스키마에 아직 없는 것들(6주 커리큘럼, 참여자별 출석률, 지난 시즌 출석 통계)은
// 실제 데이터가 없어서 이 화면에는 넣지 않았습니다. "How this room runs"는
// 방마다 달라지는 게 아니라 플랫폼 공통 안내라 정적 문구로 뒀습니다.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SiteHeader } from "./SiteHeader";
import { c, font, shadow, label } from "./tokens";

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
};

type Member = { userId: string; firstName: string | null };

const AVATAR_PALETTE = ["#AFC3B2", "#E3D8BE", "#C4CEDA", "#E1C7C7", "#D8CFE3", "#CFE0DD"];

const HOUSE_RULES = [
  "Cameras on once the room opens",
  "Let the host know if you can't make it",
  "Feedback stays on the work, not the person",
  "You'll meet through the room's video link",
];

const WEEKDAY_LONG: Record<string, string> = {
  sun: "Sundays", sunday: "Sundays",
  mon: "Mondays", monday: "Mondays",
  tue: "Tuesdays", tues: "Tuesdays", tuesday: "Tuesdays",
  wed: "Wednesdays", wednesday: "Wednesdays",
  thu: "Thursdays", thur: "Thursdays", thurs: "Thursdays", thursday: "Thursdays",
  fri: "Fridays", friday: "Fridays",
  sat: "Saturdays", saturday: "Saturdays",
};

function parseSchedule(schedule: string | null): { time: string; cadence: string } | null {
  if (!schedule) return null;
  const trimmed = schedule.trim();

  const daily = trimmed.match(/^daily\s*@\s*(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (daily) {
    return { time: `${daily[1]}:${daily[2]} ${daily[3].toUpperCase()}`, cadence: "Daily" };
  }

  const weekly = trimmed.match(/^every\s+([a-z]+)\s*@\s*(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (weekly) {
    const cadence = WEEKDAY_LONG[weekly[1].toLowerCase()] ?? weekly[1];
    return { time: `${weekly[2]}:${weekly[3]} ${weekly[4].toUpperCase()}`, cadence };
  }

  return null;
}

function CheckIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M5 13l4 4L19 7" stroke={c.accent} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- entry variant: countdown-until-unlock ---------- */
// schedule 문자열("Every Wed @ 8:00 PM" / "Daily @ 9:00 PM")에서 다음 세션
// 시각을 계산합니다. 옛 components/RoomEntry.tsx에 있던 로직 그대로입니다.

const WEEKDAY_INDEX: Record<string, number> = {
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
    const dow = WEEKDAY_INDEX[weeklyMatch[1].toLowerCase()];
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
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  // 며칠 남았으면 "6d 23h 12m"처럼 큰 단위로, 한 시간 안쪽이면 초 단위까지
  // "MM:SS"로 째깍째깍 보여줍니다. h:mm:ss 하나로 뭉쳐서 보여주면(예: "165:32:07")
  // 읽기 힘들어서 단위를 나눴습니다.
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function RoomOverview({
  roomId,
  variant = "detail",
}: {
  roomId: string;
  variant?: "detail" | "entry";
}) {
  const isEntry = variant === "entry";
  const router = useRouter();
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining] = useState(false);
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

      const roomRow = data as RoomRow;
      setRoom(roomRow);
      setLoading(false);

      const [{ data: hostProfile }, { data: memberRows }, { data: userData }] = await Promise.all([
        roomRow.leader_id
          ? supabase.from("profiles").select("first_name").eq("id", roomRow.leader_id).maybeSingle()
          : Promise.resolve({ data: null as { first_name: string | null } | null }),
        supabase.from("study_room_members").select("user_id, profiles(first_name)").eq("room_id", roomRow.id),
        supabase.auth.getUser(),
      ]);

      if (cancelled) return;

      setHostName(hostProfile?.first_name || null);
      setMembers(
        ((memberRows as any[]) ?? []).map((row) => ({
          userId: row.user_id as string,
          firstName: (row.profiles?.first_name as string | null) ?? null,
        }))
      );
      setCurrentUserId(userData?.user?.id ?? null);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  // entry variant에서만 카운트다운을 돌립니다 (schedule이 없거나 파싱 안 되면
  // remaining=0으로 취급해서 화면이 영영 잠긴 채로 멎지 않게 합니다).
  const nextStart = useMemo(
    () => (isEntry ? nextScheduledDate(room?.schedule ?? null) : null),
    [isEntry, room?.schedule]
  );

  useEffect(() => {
    if (!isEntry) return;
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
  }, [isEntry, nextStart]);

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

  const maxMembers = room.max_members ?? 0;
  const distinctIds = new Set<string>(members.map((m) => m.userId));
  if (room.leader_id) distinctIds.add(room.leader_id);
  const filledCount = Math.max(room.current_members ?? 0, distinctIds.size);
  const seatsLeft = Math.max(0, maxMembers - filledCount);
  const isLeader = !!currentUserId && currentUserId === room.leader_id;
  const isMember = isLeader || members.some((m) => m.userId === currentUserId);

  const scheduleInfo = parseSchedule(room.schedule);
  const entryUnlocked = isEntry && remaining !== null && remaining <= 0;

  // industry_1 / study_type은 방의 "카테고리"라 값이 없어도 자리표시로 보여줍니다.
  // industry_2는 선택 입력이라 실제로 있을 때만 태그를 추가합니다.
  const tags: { text: string; kind: "industry" | "type" | "loc"; placeholder?: boolean }[] = [
    { text: room.industry_1 || "To be added", kind: "industry", placeholder: !room.industry_1 },
  ];
  if (room.industry_2 && room.industry_2 !== room.industry_1) {
    tags.push({ text: room.industry_2, kind: "industry" });
  }
  tags.push({ text: room.study_type || "To be added", kind: "type", placeholder: !room.study_type });
  tags.push({
    text: room.location_type === "Online" ? "📍 Online" : `📍 ${room.location_city || "Onsite"}`,
    kind: "loc",
  });

  const roster: { key: string; name: string; isHost: boolean }[] = [];
  if (room.leader_id) {
    roster.push({ key: room.leader_id, name: hostName || "Host", isHost: true });
  }
  members.forEach((m) => {
    if (m.userId === room.leader_id) return;
    roster.push({ key: m.userId, name: m.firstName || "Member", isHost: false });
  });
  const openSlots = Math.max(0, maxMembers - roster.length);

  async function handleClaimSeat() {
    if (!room) return;

    if (!currentUserId) {
      router.push("/login");
      return;
    }

    if (isMember) {
      router.push(`/room_entry/${room.id}`);
      return;
    }

    if (seatsLeft <= 0) return;

    setJoining(true);

    const { error: insertError } = await supabase
      .from("study_room_members")
      .insert({ room_id: room.id, user_id: currentUserId });

    // 23505 = unique_violation (이미 참여 중) — 에러로 취급하지 않고 그냥 진행합니다.
    if (insertError && (insertError as any).code !== "23505") {
      setJoining(false);
      return;
    }

    // current_members 카운터를 원자적으로 올려주는 RPC/트리거가 아직 없어서
    // best-effort로만 갱신합니다 (동시 신청 시 살짝 어긋날 수 있습니다).
    await supabase
      .from("study_rooms")
      .update({ current_members: Math.min(maxMembers, filledCount + 1) })
      .eq("id", room.id);

    router.push(`/room_entry/${room.id}`);
  }

  const claimLabel = !currentUserId
    ? "Log in to claim a seat"
    : isMember
    ? "Enter the room →"
    : seatsLeft <= 0
    ? "Room is full"
    : joining
    ? "Claiming your seat…"
    : "Claim a seat";

  const claimDisabled = joining || (!isMember && !!currentUserId && seatsLeft <= 0);

  return (
    <main style={{ background: c.ground, minHeight: "100vh" }}>
      <style>{`
        .room-overview-grid { display:flex; gap:56px; align-items:flex-start; }
        .room-overview-side { width:380px; flex:0 0 auto; }
        @media (max-width: 860px) {
          .room-overview-grid { flex-direction:column; }
          .room-overview-side { width:100%; }
        }
        @keyframes roomEntryPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20,107,78,0.35); }
          50% { box-shadow: 0 0 0 10px rgba(20,107,78,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .room-entry-btn.active { animation: none !important; }
        }
      `}</style>

      <SiteHeader compact />

      <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px 96px" }}>
        <div style={{ width: "100%", maxWidth: 1120 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              padding: 0,
              marginBottom: 22,
              fontFamily: font.ui,
              fontSize: 14,
              color: c.ink2,
              cursor: "pointer",
            }}
          >
            <span aria-hidden="true">←</span> Back
          </button>

          <div className="room-overview-grid">
            {/* ===== left column ===== */}
            <div style={{ flex: "1 1 auto", minWidth: 0, maxWidth: 700 }}>
              {scheduleInfo ? (
                <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 6, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: font.mono, fontSize: 40, fontWeight: 600, color: c.ink }}>
                    {scheduleInfo.time}
                  </div>
                  <div style={{ ...label }}>{scheduleInfo.cadence} · your time</div>
                </div>
              ) : (
                room.schedule && (
                  <div style={{ ...label, marginBottom: 10 }}>{room.schedule} · your time</div>
                )
              )}

              <h1
                style={{
                  margin: "6px 0 20px",
                  fontFamily: font.display,
                  fontSize: 40,
                  fontWeight: 650,
                  lineHeight: 1.15,
                  color: c.ink,
                }}
              >
                {room.title}
              </h1>

              {room.description && (
                <p style={{ margin: "0 0 22px", fontSize: 15.5, lineHeight: 1.7, color: c.ink2, maxWidth: 620 }}>
                  {room.description}
                </p>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: "5px 12px",
                      borderRadius: 999,
                      background: tag.placeholder
                        ? c.neutralTint
                        : tag.kind === "industry"
                        ? c.accentTint
                        : tag.kind === "type"
                        ? c.neutralTint
                        : c.card,
                      color: tag.placeholder ? c.ink3 : tag.kind === "industry" ? c.accent : c.ink2,
                      fontStyle: tag.placeholder ? "italic" : "normal",
                      border: tag.kind === "loc" ? `1px solid ${c.hair}` : "none",
                    }}
                  >
                    {tag.text}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 999,
                    background: c.neutralTint,
                    border: `1px solid ${c.hair}`,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: font.display,
                    fontSize: 18,
                    color: c.ink2,
                  }}
                >
                  {(hostName || "?").trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: c.ink }}>
                    Hosted by {hostName || "Not assigned yet"}
                  </div>
                  <div style={{ fontSize: 13.5, color: c.ink3, marginTop: 2 }}>
                    {room.location_type === "Online" ? "Online" : room.location_city || "Location not set yet"}
                  </div>
                </div>
              </div>

              {isEntry && (
                <>
                  <div style={{ borderTop: `1px solid ${c.hair}`, marginBottom: 28 }} />

                  <div style={{ ...label, marginBottom: 16 }}>Who&#39;s in the room</div>

                  <div style={{ display: "flex", gap: 26, marginBottom: 32, flexWrap: "wrap" }}>
                    {roster.map((person, i) => (
                      <div key={person.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 999,
                            background: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 15,
                            fontWeight: 600,
                            color: c.ink,
                          }}
                        >
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: c.ink }}>{person.name}</div>
                        {person.isHost && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: "0.05em",
                              color: "#FFFFFF",
                              background: c.accent,
                              padding: "2px 6px",
                              borderRadius: 999,
                            }}
                          >
                            HOST
                          </span>
                        )}
                      </div>
                    ))}
                    {Array.from({ length: Math.min(openSlots, 6) }).map((_, i) => (
                      <div key={`open-${i}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 999, border: `1.5px dashed ${c.hair}` }} />
                        <div style={{ fontSize: 13.5, color: c.ink3 }}>Open</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={{ borderTop: `1px solid ${c.hair}`, marginBottom: 28 }} />

              <div style={{ ...label, marginBottom: 16 }}>How this room runs</div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px 28px" }}>
                {HOUSE_RULES.map((rule) => (
                  <div key={rule} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <CheckIcon />
                    <span style={{ fontSize: 14.5, color: c.ink2, lineHeight: 1.5 }}>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ===== right column ===== */}
            <div className="room-overview-side">
              <div
                style={{
                  background: c.card,
                  border: `1px solid ${c.hair}`,
                  borderRadius: 16,
                  boxShadow: shadow.panel,
                  padding: 26,
                }}
              >
                <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
                  {Array.from({ length: Math.min(Math.max(maxMembers, 1), 8) }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: 999,
                        background: i < filledCount ? c.accent : "transparent",
                        border: i < filledCount ? "none" : `1.5px solid ${c.hair}`,
                      }}
                    />
                  ))}
                </div>

                <div style={{ fontSize: 19, fontWeight: 700, color: c.ink, marginBottom: 4 }}>
                  {maxMembers > 0 ? `${filledCount} of ${maxMembers} joined.` : `${filledCount} joined so far.`}{" "}
                  <span style={{ fontSize: 12, fontWeight: 500, color: c.ink3 }}>
                    (snapshot — not live yet, needs real-time presence)
                  </span>
                </div>
                <div style={{ fontSize: 14, color: c.ink2, marginBottom: 20 }}>
                  {room.schedule ? `Meets ${room.schedule}.` : "Schedule not set yet."}
                </div>

                {isEntry && (
                  <div style={{ textAlign: "center", margin: "4px 0 22px" }}>
                    <div
                      style={{
                        ...label,
                        marginBottom: 8,
                        color: entryUnlocked ? c.accent : c.ink3,
                        transition: "color .3s ease",
                      }}
                    >
                      {entryUnlocked ? "Room is open" : "Starts in"}
                    </div>
                    <div
                      style={{
                        fontFamily: font.mono,
                        fontSize: 40,
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                        color: c.ink,
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1,
                      }}
                    >
                      {fmtCountdown(remaining ?? 0)}
                    </div>
                  </div>
                )}

                {isEntry ? (
                  <button
                    type="button"
                    className={`room-entry-btn${entryUnlocked ? " active" : ""}`}
                    disabled={!entryUnlocked}
                    onClick={() => entryUnlocked && router.push(`/study_room/${room.id}`)}
                    style={{
                      width: "100%",
                      height: 50,
                      border: "none",
                      borderRadius: 8,
                      background: entryUnlocked ? c.accent : c.neutralTint,
                      color: entryUnlocked ? "#FFFFFF" : c.ink3,
                      fontFamily: font.ui,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: entryUnlocked ? "pointer" : "not-allowed",
                      marginBottom: 20,
                      transition: "background .3s ease, color .3s ease, box-shadow .3s ease",
                      animation: entryUnlocked ? "roomEntryPulse 2s ease-in-out infinite" : "none",
                    }}
                  >
                    {entryUnlocked ? "Room 입장 →" : "Unlocks when the countdown ends"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClaimSeat}
                    disabled={claimDisabled}
                    style={{
                      width: "100%",
                      height: 50,
                      border: "none",
                      borderRadius: 8,
                      background: claimDisabled ? c.neutralTint : c.accent,
                      color: claimDisabled ? c.ink3 : "#FFFFFF",
                      fontFamily: font.ui,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: claimDisabled ? "not-allowed" : "pointer",
                      marginBottom: 20,
                    }}
                  >
                    {claimLabel}
                  </button>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                    <CheckIcon size={14} />
                    <span style={{ fontSize: 13.5, color: c.ink2, lineHeight: 1.5 }}>Free to join</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                    <CheckIcon size={14} />
                    <span style={{ fontSize: 13.5, color: c.ink2, lineHeight: 1.5 }}>
                      Goes straight to room entry once you&#39;re in
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                    <CheckIcon size={14} />
                    <span style={{ fontSize: 13.5, color: c.ink2, lineHeight: 1.5 }}>Leave anytime, no penalty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
