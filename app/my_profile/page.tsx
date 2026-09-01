"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { c, font } from "@/components/tokens";
import { SiteHeader } from "@/components/SiteHeader";

type ProfileData = {
  first_name?: string | null;
  interest_industry_1?: string[] | null;
  interest_industry_2?: string[] | null;
  contact_link?: string | null;
  is_onboarded?: boolean | null;
  // Professional tab — NOTE: these column names are a best guess (school,
  // job_title, experience, industry, certifications, languages, location,
  // timezone). Rename here + in the JSX below to match your actual
  // `profiles` schema once those columns exist.
  school?: string | null;
  job_title?: string | null;
  experience?: string | null;
  industry?: string[] | null;
  certifications?: string | null;
  languages?: string | null;
  location?: string | null;
  timezone?: string | null;
};

type ProfileTab = "general" | "professional";

export default function MyProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [tab, setTab] = useState<ProfileTab>("general");

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // select("*") on purpose: the Professional tab reads columns
      // (school, job_title, …) that may not exist in every environment yet.
      // Naming them explicitly would make the whole query — including the
      // General tab fields — fail if even one column is missing.
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }

    void loadProfile();
  }, [router]);

  if (loading) {
    return <main style={{ background: c.ground, minHeight: "100vh" }} />;
  }

  const firstName = profile?.first_name || "Your profile";
  const initial = (profile?.first_name || "?").trim().charAt(0).toUpperCase();
  const primaryInterest = profile?.interest_industry_1?.length
    ? profile.interest_industry_1.join(" / ")
    : "Not set yet";
  const secondaryInterest = profile?.interest_industry_2?.length
    ? profile.interest_industry_2.join(" / ")
    : "Not set yet";
  const industryTags = profile?.industry?.length ? profile.industry : null;

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: "general", label: "General" },
    { key: "professional", label: "Professional" },
  ];

  return (
    <main style={{ background: c.ground, minHeight: "100vh" }}>
      <SiteHeader compact />

      <div style={{ display: "flex", justifyContent: "center", padding: "48px 20px" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: "18px",
            padding: "40px",
            width: "100%",
            maxWidth: "620px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <p
            style={{
              fontFamily: font.ui,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: c.ink2,
              margin: 0,
              marginBottom: 10,
            }}
          >
            My profile
          </p>

          <h1
            style={{
              margin: 0,
              marginBottom: 10,
              fontFamily: font.display,
              fontSize: 34,
              color: c.ink,
            }}
          >
            {firstName}
          </h1>

          <p
            style={{
              fontFamily: font.ui,
              fontSize: 15,
              color: c.ink2,
              margin: 0,
              marginBottom: 28,
            }}
          >
            {profile?.is_onboarded ? "Your profile is complete." : "Your profile is still being set up."}
          </p>

          {/* tabs */}
          <div style={{ display: "flex", gap: 22, borderBottom: "1px solid #E5E7EB", marginBottom: 26 }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  appearance: "none",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: font.ui,
                  fontSize: 14,
                  fontWeight: 600,
                  color: tab === t.key ? c.ink : c.ink3,
                  padding: "0 2px 12px",
                  marginBottom: -1,
                  borderBottom: tab === t.key ? `2px solid ${c.accent}` : "2px solid transparent",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "general" && (
            <div style={{ display: "grid", gap: 20 }}>
              <div>
                <div style={{ fontFamily: font.ui, fontSize: 12, color: c.ink2, marginBottom: 6 }}>
                  Primary interest
                </div>
                <div style={{ fontFamily: font.ui, fontSize: 16, color: c.ink }}>{primaryInterest}</div>
              </div>

              <div>
                <div style={{ fontFamily: font.ui, fontSize: 12, color: c.ink2, marginBottom: 6 }}>
                  Secondary interest
                </div>
                <div style={{ fontFamily: font.ui, fontSize: 16, color: c.ink }}>{secondaryInterest}</div>
              </div>

              <div>
                <div style={{ fontFamily: font.ui, fontSize: 12, color: c.ink2, marginBottom: 6 }}>
                  LinkedIn
                </div>
                <div style={{ fontFamily: font.ui, fontSize: 16, color: c.ink }}>
                  {profile?.contact_link || "Not added yet"}
                </div>
              </div>
            </div>
          )}

          {tab === "professional" && (
            <div style={{ display: "grid", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    background: c.neutralTint,
                    border: "1px solid #E5E7EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: font.display,
                    fontSize: 20,
                    color: c.ink2,
                    flexShrink: 0,
                  }}
                >
                  {initial}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontFamily: font.ui, fontSize: 12, color: c.ink2 }}>Photo</div>
                  <div style={{ fontFamily: font.ui, fontSize: 13, fontWeight: 600, color: c.accent }}>
                    Change photo
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontFamily: font.ui, fontSize: 12, color: c.ink2, marginBottom: 6 }}>
                  School
                </div>
                <div style={{ fontFamily: font.ui, fontSize: 16, color: c.ink }}>
                  {profile?.school || "Not set yet"}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: font.ui, fontSize: 12, color: c.ink2, marginBottom: 6 }}>
                  Job title
                </div>
                <div style={{ fontFamily: font.ui, fontSize: 16, color: c.ink }}>
                  {profile?.job_title || "Not set yet"}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: font.ui, fontSize: 12, color: c.ink2, marginBottom: 6 }}>
                  Experience
                </div>
                <div style={{ fontFamily: font.ui, fontSize: 16, color: c.ink }}>
                  {profile?.experience || "Not set yet"}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: font.ui, fontSize: 12, color: c.ink2, marginBottom: 6 }}>
                  Industry
                </div>
                {industryTags ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {industryTags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          background: c.accentTint,
                          color: c.accent,
                          fontFamily: font.ui,
                          fontSize: 13,
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 999,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontFamily: font.ui, fontSize: 16, color: c.ink }}>Not set yet</div>
                )}
              </div>

              <div>
                <div style={{ fontFamily: font.ui, fontSize: 12, color: c.ink2, marginBottom: 6 }}>
                  Certifications
                </div>
                <div style={{ fontFamily: font.ui, fontSize: 16, color: c.ink }}>
                  {profile?.certifications || "Not set yet"}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: font.ui, fontSize: 12, color: c.ink2, marginBottom: 6 }}>
                  Language
                </div>
                <div style={{ fontFamily: font.ui, fontSize: 16, color: c.ink }}>
                  {profile?.languages || "Not set yet"}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: font.ui, fontSize: 12, color: c.ink2, marginBottom: 6 }}>
                  Location
                </div>
                <div style={{ fontFamily: font.ui, fontSize: 16, color: c.ink }}>
                  {profile?.location || "Not set yet"}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: font.ui, fontSize: 12, color: c.ink2, marginBottom: 6 }}>
                  Timezone
                </div>
                <div style={{ fontFamily: font.ui, fontSize: 16, color: c.ink }}>
                  {profile?.timezone || "Not set yet"}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 28 }}>
            <Link
              href="/onboarding"
              style={{
                display: "inline-block",
                textDecoration: "none",
                background: c.accent,
                color: "#fff",
                padding: "10px 18px",
                borderRadius: 999,
                fontFamily: font.ui,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Edit profile
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
