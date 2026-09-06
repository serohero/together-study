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
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

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
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 16 : 34, flexShrink: 0 }}>
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

        <Link
          href="/how-it-works"
          prefetch={false}
          className="rt-nav-link"
          style={{ color: c.ink2, textDecoration: "none", fontFamily: font.ui, fontSize: isMobile ? 13.5 : 14.5 }}
        >
          How-To
        </Link>
      </div>

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
        {/* 찜 / 알림 (장식용 -- 아직 실제 저장/알림 기능 없음, 모바일에서도 노출) */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              className="rt-icon-btn"
              aria-label="Favorites"
              title="Favorites"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <svg width={17} height={17} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 20s-7.5-4.6-10-9.3C.5 7.4 2.4 4 6 4c2 0 3.6 1.1 4.5 2.6C11.4 5.1 13 4 15 4c3.6 0 5.5 3.4 4 6.7C19.5 15.4 12 20 12 20z"
                  stroke={c.ink2}
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="rt-icon-btn"
              aria-label="Notifications"
              title="Notifications"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <svg width={17} height={17} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 9a6 6 0 0 1 12 0c0 4 1.4 5.6 2 6.3.2.2 0 .7-.3.7H4.3c-.3 0-.5-.5-.3-.7C4.6 14.6 6 13 6 9z"
                  stroke={c.ink2}
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                />
                <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" stroke={c.ink2} strokeWidth={1.6} strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* 로그인 상태 + 방이 있을 때 Study Room 메뉴 (데스크톱에서만 인라인 노출, 모바일은 햄버거 메뉴 안으로) */}
        {!isMobile && user && hasRooms && (
          <div ref={pickerRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={handleStudyRoomClick}
              disabled={!studyRoomEnabled}
              className="rt-nav-link"
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
              My Room
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

        {/* Log in -- 로그아웃 상태일 땐 모바일/데스크톱 둘 다 인라인 노출 */}
        {!user && (
          <Link
            href="/login"
            prefetch={false}
            className="rt-nav-link"
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

        {/* Profile -- 데스크톱에서만 인라인 노출, 모바일은 햄버거 메뉴 안으로 */}
        {!isMobile && user && (
          <Link
            href="/my_profile"
            prefetch={false}
            className="rt-nav-link"
            style={{ color: c.ink, fontWeight: 500, textDecoration: "none" }}
          >
            Profile
          </Link>
        )}

        {/* + Room -- 데스크톱에서만 인라인 노출, 모바일은 햄버거 메뉴 안으로 */}
        {!isMobile && user && (
          <Link
            href="/rooms/new"
            prefetch={false}
            className="rt-btn-chip"
            style={{
              color: c.ink,
              fontWeight: 600,
              textDecoration: "none",
              background: "transparent",
              border: "none",
              padding: 0,
              borderRadius: 0,
              whiteSpace: "nowrap",
            }}
          >
            + Room
          </Link>
        )}

        {/* Log out -- 데스크톱에서만 인라인 노출, 모바일은 햄버거 메뉴 안으로 */}
        {!isMobile && user && (
          <button
            type="button"
            onClick={handleLogout}
            className="rt-nav-link"
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

        {/* 모바일 햄버거 메뉴 -- My Room / Profile / + Room / Log out을 여기로 압축 */}
        {isMobile && user && (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="rt-icon-btn"
              aria-label="Menu"
              title="Menu"
              onClick={() => setMenuOpen((open) => !open)}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" stroke={c.ink2} strokeWidth={1.6} strokeLinecap="round" />
              </svg>
            </button>

            {menuOpen && (
              <div
                className="rt-menu-dropdown"
                style={{
                  position: "absolute",
                  top: "calc(100% + 12px)",
                  right: 0,
                  minWidth: 190,
                  background: c.card,
                  border: `1px solid ${c.hair}`,
                  borderRadius: 12,
                  boxShadow: shadow.popover,
                  padding: 6,
                  zIndex: 30,
                }}
              >
                {hasRooms && (
                  <button
                    type="button"
                    className="rt-menu-item"
                    onClick={() => {
                      handleStudyRoomClick();
                      if (myRooms.length === 1) setMenuOpen(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      padding: "10px 14px",
                      borderRadius: 6,
                      fontFamily: font.ui,
                      fontSize: 14,
                      color: c.ink,
                      cursor: "pointer",
                    }}
                  >
                    My Room
                  </button>
                )}

                {hasRooms && pickerOpen && myRooms.length > 1 && (
                  <div style={{ padding: "0 4px 4px" }}>
                    {myRooms.map((room) => (
                      <Link
                        key={room.id}
                        href={`/room_entry/${room.id}`}
                        prefetch={false}
                        className="rt-menu-item"
                        onClick={() => {
                          setPickerOpen(false);
                          setMenuOpen(false);
                        }}
                        style={{
                          display: "block",
                          padding: "8px 14px",
                          borderRadius: 6,
                          fontFamily: font.ui,
                          fontSize: 13,
                          color: c.ink2,
                          textDecoration: "none",
                        }}
                      >
                        {room.title}
                      </Link>
                    ))}
                  </div>
                )}

                <Link
                  href="/my_profile"
                  prefetch={false}
                  className="rt-menu-item"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "block",
                    padding: "10px 14px",
                    borderRadius: 6,
                    fontFamily: font.ui,
                    fontSize: 14,
                    color: c.ink,
                    textDecoration: "none",
                  }}
                >
                  Profile
                </Link>

                <Link
                  href="/rooms/new"
                  prefetch={false}
                  className="rt-menu-item"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "block",
                    padding: "10px 14px",
                    borderRadius: 6,
                    fontFamily: font.ui,
                    fontSize: 14,
                    color: c.ink,
                    textDecoration: "none",
                  }}
                >
                  + Room
                </Link>

                <div style={{ height: 1, background: c.hair, margin: "6px 4px" }} />

                <button
                  type="button"
                  className="rt-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: 6,
                    fontFamily: font.ui,
                    fontSize: 14,
                    color: c.ink2,
                    cursor: "pointer",
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}