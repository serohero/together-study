"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { c, font } from "./tokens";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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