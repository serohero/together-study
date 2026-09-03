// src/components/SiteHeader.tsx
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
  const [isMobile, setIsMobile] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 모바일 화면 감지 (640px 기준)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box",
        // 모바일일 땐 좌우 16px 패딩, 데스크톱일 땐 기존 56px 유지
        padding: isMobile ? "16px 16px" : compact ? "22px 56px" : "24px 56px",
      }}
    >
      <Link
        href="/"
        prefetch={false}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          textDecoration: "none",
          color: c.ink,
          flexShrink: 0,
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
          style={{
            fontFamily: font.display,
            fontSize: isMobile ? 18 : 20,
            letterSpacing: "-0.01em",
            fontWeight: 500,
          }}
        >
          Roundtable
        </span>
      </Link>

      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 12 : 24,
          fontFamily: font.ui,
          fontSize: isMobile ? 13.5 : 14.5,
          flexShrink: 0,
        }}
      >
        {/* 로그인 상태 + 방이 있을 때 Study Room 메뉴 */}
        {user && hasRooms && (
          <div ref={pickerRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={handleStudyRoomClick}
              disabled={!studyRoomEnabled}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: c.ink2,
                fontFamily: font.ui,
                fontSize: isMobile ? 13.5 : 14.5,
                cursor: "pointer",
              }}
            >
              Room
            </button>

            {pickerOpen && myRooms.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 12px)",
                  right: 0,
                  minWidth: 200,
                  maxWidth: 280,
                  background: c.card,
                  border: `1px solid ${c.hair}`,
                  borderRadius: 10,
                  boxShadow: shadow.popover,
                  overflow: "hidden",
                  zIndex: 30,
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
                      fontSize: 13.5,
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

        {/* PC 화면에서만 보이는 How it works */}
        {!isMobile && (
          <Link href="/how-it-works" prefetch={false} style={{ color: c.ink2, textDecoration: "none" }}>
            How it works
          </Link>
        )}

        {/* 로그인 여부에 따른 Profile / Log in 버튼 (모바일에서도 항상 노출) */}
        {user ? (
          <>
            <Link
              href="/my_profile"
              prefetch={false}
              style={{ color: c.ink, fontWeight: 500, textDecoration: "none" }}
            >
              Profile
            </Link>
            {!isMobile && (
              <button
                type="button"
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
            )}
          </>
        ) : (
          <Link
            href="/login"
            prefetch={false}
            style={{
              color: c.ink,
              fontWeight: 500,
              textDecoration: "none",
              padding: isMobile ? "4px 6px" : 0,
            }}
          >
            Log in
          </Link>
        )}

        {/* Start a room (+ Room) 버튼 */}
        <Link
          href="/rooms/new"
          prefetch={false}
          style={{
            color: c.ink,
            fontWeight: 600,
            textDecoration: "none",
            background: isMobile ? "#EBF1EC" : "transparent",
            border: isMobile ? `1px solid ${c.hair}` : "none",
            padding: isMobile ? "6px 12px" : "0",
            borderRadius: isMobile ? 6 : 0,
            whiteSpace: "nowrap",
          }}
        >
          {isMobile ? "+ Room" : "Start a room"}
        </Link>
      </nav>
    </header>
  );
}