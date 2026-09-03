"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { c, font, shadow } from "./tokens";

type MyRoom = { id: number; title: string };

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [myRooms, setMyRooms] = useState<MyRoom[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 로그인한 사용자와 관련된 스터디룸 목록 (내가 리더인 방 + 멤버로 참여 중인 방).
  // "Study room" 버튼 활성화 여부 + 여러 개일 때 고를 목록으로 씁니다.
  useEffect(() => {
    if (!user) {
      setMyRooms([]);
      return;
    }
    let cancelled = false;

    async function loadMyRooms() {
      const [{ data: led }, { data: joined }] = await Promise.all([
        supabase.from("study_rooms").select("id, title").eq("leader_id", user.id),
        supabase
          .from("study_room_members")
          .select("study_rooms(id, title)")
          .eq("user_id", user.id),
      ]);

      if (cancelled) return;

      // 리더인 방과 참여 중인 방을 합치고, id 기준으로 중복을 제거합니다
      // (리더가 자기 방의 멤버로도 등록돼 있는 경우 대비).
      const merged = new Map<number, MyRoom>();
      (led ?? []).forEach((room) => merged.set(room.id, room as MyRoom));
      (joined ?? []).forEach((row: any) => {
        const room = row.study_rooms as MyRoom | null;
        if (room) merged.set(room.id, room);
      });

      setMyRooms(Array.from(merged.values()));
    }

    void loadMyRooms();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // 드롭다운 바깥을 클릭하면 닫습니다.
  useEffect(() => {
    if (!pickerOpen) return;
    const onClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [pickerOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const hasRooms = myRooms.length > 0;
  const studyRoomEnabled = Boolean(user) && hasRooms;

  const handleStudyRoomClick = () => {
    if (!studyRoomEnabled) return;
    if (myRooms.length === 1) {
      router.push(`/room_entry/${myRooms[0].id}`);
      return;
    }
    setPickerOpen((open) => !open);
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: compact ? "22px 56px" : "24px 56px",
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          textDecoration: "none",
          color: c.ink,
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="7" stroke={c.accent} strokeWidth={1.3} />
          <circle cx="12" cy="5" r="1.7" fill={c.accent} />
          <circle cx="18.1" cy="8.5" r="1.7" fill={c.accent} />
          <circle cx="18.1" cy="15.5" r="1.7" fill={c.accent} />
          <circle cx="12" cy="19" r="1.7" fill={c.accent} />
          <circle cx="5.9" cy="15.5" r="1.7" stroke="#B6C1B9" />
          <circle cx="5.9" cy="8.5" r="1.7" stroke="#B6C1B9" />
        </svg>
        <span
          style={{ fontFamily: font.display, fontSize: 20, letterSpacing: "-0.01em" }}
        >
          Roundtable
        </span>
      </Link>

      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          fontFamily: font.ui,
          fontSize: 14.5,
        }}
      >
        {user && (
          <div ref={pickerRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={handleStudyRoomClick}
              disabled={!studyRoomEnabled}
              title={
                !hasRooms
                  ? "You haven't registered a study yet"
                  : undefined
              }
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: studyRoomEnabled ? c.ink2 : c.ink4,
                fontFamily: font.ui,
                fontSize: 14.5,
                cursor: studyRoomEnabled ? "pointer" : "not-allowed",
              }}
            >
              Study room
            </button>

            {pickerOpen && myRooms.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 12px)",
                  right: 0,
                  minWidth: 240,
                  maxWidth: 320,
                  background: c.card,
                  border: `1px solid ${c.hair}`,
                  borderRadius: 10,
                  boxShadow: shadow.popover,
                  overflow: "hidden",
                  zIndex: 20,
                }}
              >
                <div
                  style={{
                    padding: "12px 14px 8px",
                    fontFamily: font.mono,
                    fontSize: 10.5,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: c.ink3,
                  }}
                >
                  Your study rooms
                </div>
                {myRooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/room_entry/${room.id}`}
                    prefetch={false}
                    onClick={() => setPickerOpen(false)}
                    style={{
                      display: "block",
                      padding: "10px 14px",
                      fontFamily: font.ui,
                      fontSize: 14,
                      color: c.ink,
                      textDecoration: "none",
                      borderTop: `1px solid ${c.hairSoft}`,
                    }}
                  >
                    {room.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <Link href="/how-it-works" prefetch={false} style={{ color: c.ink2, textDecoration: "none" }}>
          How it works
        </Link>

        {user ? (
          <>
            <Link href="/my_profile" prefetch={false} style={{ color: c.ink2, textDecoration: "none" }}>
              Profile
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: c.ink2,
                fontFamily: font.ui,
                fontSize: 14.5,
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <Link href="/login" prefetch={false} style={{ color: c.ink2, textDecoration: "none" }}>
            Log in
          </Link>
        )}

        <Link
          href="/rooms/new"
          prefetch={false}
          style={{ color: c.ink, fontWeight: 500, textDecoration: "none" }}
        >
          Start a room
        </Link>
      </nav>
    </header>
  );
}
