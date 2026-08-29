// app/onboarding/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { c, font } from "@/components/tokens";
import { SiteHeader } from "@/components/SiteHeader";

interface CategoryItem {
  layer_1: string;
  layer_2: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");

  // DB 카테고리 데이터
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // 폼 입력 상태
  const [firstName, setFirstName] = useState("");
  const [interest1L1, setInterest1L1] = useState("");
  const [interest1L2, setInterest1L2] = useState("");
  const [interest2L1, setInterest2L1] = useState("");
  const [interest2L2, setInterest2L2] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    async function init() {
      // 1. 유저 인증 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);

      // 2. 카테고리 마스터 테이블 조회
      const { data: catData } = await supabase.from("categories").select("layer_1, layer_2");
      if (catData && catData.length > 0) {
        setCategories(catData);
      }

      // 3. 기존 profiles 테이블에 저장된 내 데이터 불러오기 (기존 값 복원)
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, interest_industry_1, interest_industry_2, contact_link, is_onboarded")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFirstName(profile.first_name || user.user_metadata?.name || user.email?.split("@")[0] || "");
        
        if (profile.interest_industry_1 && profile.interest_industry_1.length >= 2) {
          setInterest1L1(profile.interest_industry_1[0]);
          setInterest1L2(profile.interest_industry_1[1]);
        } else if (catData && catData.length > 0) {
          setInterest1L1(catData[0].layer_1);
          setInterest1L2(catData[0].layer_2);
        }

        if (profile.interest_industry_2 && profile.interest_industry_2.length >= 2) {
          setInterest2L1(profile.interest_industry_2[0]);
          setInterest2L2(profile.interest_industry_2[1]);
        }

        if (profile.contact_link) {
          setLinkedinUrl(profile.contact_link);
        }

        if (profile.is_onboarded) {
          setIsEditMode(true);
        }
      }

      setLoading(false);
    }
    init();
  }, [router]);

  // Layer 1 고유 목록 추출
  const layer1Options = useMemo(() => {
    return Array.from(new Set(categories.map((c) => c.layer_1)));
  }, [categories]);

  // 관심분야 1의 Layer 2 목록
  const layer2Options1 = useMemo(() => {
    return categories.filter((c) => c.layer_1 === interest1L1).map((c) => c.layer_2);
  }, [categories, interest1L1]);

  // 관심분야 2의 Layer 2 목록
  const layer2Options2 = useMemo(() => {
    return categories.filter((c) => c.layer_1 === interest2L1).map((c) => c.layer_2);
  }, [categories, interest2L1]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          interest_industry_1: [interest1L1, interest1L2],
          interest_industry_2: interest2L1 && interest2L2 ? [interest2L1, interest2L2] : null,
          contact_link: linkedinUrl || null,
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;
      router.push("/");
    } catch (err: any) {
      console.error("Profile save failed:", err.message);
      alert("프로필 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main style={{ background: c.ground, minHeight: "100vh" }} />;

  const selectStyle = {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    fontFamily: font.ui,
    fontSize: "14px",
    background: "#fff",
    color: c.ink,
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontFamily: font.ui,
    fontSize: "13.5px",
    fontWeight: 500,
    color: c.ink,
    marginBottom: "6px",
  };

  return (
    <main style={{ background: c.ground, minHeight: "100vh" }}>
      <SiteHeader compact />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px 20px" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #E5E7EB",
            borderRadius: "16px",
            padding: "40px",
            maxWidth: "520px",
            width: "100%",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <h1 style={{ fontFamily: font.display, fontSize: "26px", color: c.ink, marginBottom: "8px" }}>
            {isEditMode ? "Edit Your Profile" : `Welcome, ${firstName}!`}
          </h1>
          <p style={{ fontFamily: font.ui, fontSize: "14px", color: c.ink2, marginBottom: "28px" }}>
            {isEditMode 
              ? "Update your interests and links to stay matched with relevant study groups." 
              : "Set your interests to match with the right study rooms."}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            {/* Display Name */}
            <div>
              <label style={labelStyle}> Display Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  fontFamily: font.ui,
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Primary Interest (관심분야 1) */}
            <div>
              <label style={labelStyle}>Primary Interest *</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  value={interest1L1}
                  onChange={(e) => {
                    const l1 = e.target.value;
                    setInterest1L1(l1);
                    const sub = categories.find((c) => c.layer_1 === l1)?.layer_2 || "";
                    setInterest1L2(sub);
                  }}
                  style={selectStyle}
                >
                  {layer1Options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <select
                  value={interest1L2}
                  onChange={(e) => setInterest1L2(e.target.value)}
                  style={selectStyle}
                >
                  {layer2Options1.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Secondary Interest (관심분야 2) */}
            <div>
              <label style={labelStyle}>
                Secondary Interest <span style={{ color: c.ink2, fontWeight: 400 }}>(Optional)</span>
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  value={interest2L1}
                  onChange={(e) => {
                    const l1 = e.target.value;
                    setInterest2L1(l1);
                    const sub = categories.find((c) => c.layer_1 === l1)?.layer_2 || "";
                    setInterest2L2(sub);
                  }}
                  style={selectStyle}
                >
                  <option value="">None</option>
                  {layer1Options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <select
                  value={interest2L2}
                  disabled={!interest2L1}
                  onChange={(e) => setInterest2L2(e.target.value)}
                  style={{ ...selectStyle, opacity: interest2L1 ? 1 : 0.5 }}
                >
                  <option value="">None</option>
                  {layer2Options2.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* LinkedIn Account */}
            <div>
              <label style={labelStyle}>
                LinkedIn Account <span style={{ color: c.ink2, fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  fontFamily: font.ui,
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: c.accent,
                color: "#ffffff",
                fontFamily: font.ui,
                fontSize: "15px",
                fontWeight: 500,
                cursor: saving ? "not-allowed" : "pointer",
                marginTop: "10px",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : isEditMode ? "Save Changes" : "Complete Setup"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}