"use client";

import { supabase } from "@/lib/supabase";
import { c, font } from "@/components/tokens";
import { SiteHeader } from "@/components/SiteHeader";

export default function LoginPage() {
  const handleGoogleSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (error) {
      console.error("Login failed:", error);
      alert("로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <main style={{ background: c.ground, minHeight: "100vh" }}>
      <SiteHeader compact />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 100px)",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #E5E7EB",
            borderRadius: "16px",
            padding: "40px 36px",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <h1
            style={{
              fontFamily: font.display,
              fontSize: "26px",
              color: c.ink,
              marginBottom: "8px",
            }}
          >
            Welcome to Roundtable
          </h1>
          <p
            style={{
              fontFamily: font.ui,
              fontSize: "14px",
              color: c.ink2,
              marginBottom: "32px",
            }}
          >
            Study anything, same time, same people.
          </p>

          <button
            onClick={handleGoogleSignIn}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              width: "100%",
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1px solid #D1D5DB",
              background: "#ffffff",
              cursor: "pointer",
              fontFamily: font.ui,
              fontSize: "15px",
              fontWeight: 500,
              color: c.ink,
            }}
          >
            <svg width={18} height={18} viewBox="0 0 533.5 544.3">
              <path fill="#4285F4" d="M533.5 278.4c0-18.5-1.6-36.3-4.7-53.6H272v101.4h147.3c-6.4 34.9-25.7 64.4-54.8 84v69.6h88.5c51.8-47.8 82.5-118 82.5-201.4z"/>
              <path fill="#34A853" d="M272 544.3c73.6 0 135.4-24.4 180.5-66.2l-88.5-69.6c-24.6 16.6-56 26.4-92 26.4-70.7 0-130.6-47.6-152-111.4H28.7v69.9C74 476.8 167.6 544.3 272 544.3z"/>
              <path fill="#FBBC05" d="M120 327.9c-10.9-32.7-10.9-68.2 0-100.9V157.1H28.7C-12.9 220.8-12.9 323.5 28.7 387.2L120 327.9z"/>
              <path fill="#EA4335" d="M272 107.7c38.8 0 73.9 13.4 101.4 39l76-76C401 24 339.2 0 272 0 167.6 0 74 67.5 28.7 157.1l91.3 69.9c21.4-63.8 81.3-111.4 152-111.4z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </main>
  );
}