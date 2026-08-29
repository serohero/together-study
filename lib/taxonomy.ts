// src/lib/taxonomy.ts
// 팀에서 확정한 카테고리 7개 × 서브카테고리 84개.
// 순서는 팀이 준 목록 그대로입니다. id는 URL에 그대로 들어가므로 바꾸지 마세요.

import type { Category, Subcategory } from "./types";

function sub(categoryId: string, label: string): Subcategory {
  return {
    id: label
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    label,
    categoryId,
  };
}

function cat(id: string, label: string, labels: string[]): Category {
  return { id, label, subcategories: labels.map((l) => sub(id, l)) };
}

export const CATEGORIES: Category[] = [
  cat("technology", "Technology", [
    "AI",
    "Software Engineering",
    "Data Science",
    "AI for Product Development",
    "IT Management",
    "Climate Tech & Sustainability",
    "Product Management",
    "Cybersecurity",
    "Site Reliability Engineering",
    "Blockchain & Crypto",
    "Web Development",
    "Database Design & Development",
    "Product Design",
  ]),
  cat("health-medicine", "Health & Medicine", [
    "Medical School",
    "MCAT",
    "Dental School",
    "DAT",
    "Physician & Medical Practice",
    "Medical Residency & Fellowships",
    "Physician Assistant",
    "PA School",
    "Dental Residency",
    "Pharmaceutical",
    "Healthcare Administration",
  ]),
  cat("law-public-service", "Law & Public Service", [
    "Legal Practice",
    "Public Service & Administration",
    "Non-Profit Leadership",
    "Public Policy",
    "Law School",
    "LSAT",
    "Military",
  ]),
  cat("business", "Business", [
    "Management Consulting",
    "Business Operations & Strategy",
    "Chief of Staff",
    "Corporate Development",
    "Startup Founders",
    "Search Fund & ETA",
    "Small Business",
    "MBA",
    "Marketing",
    "Sales",
    "Sales Operations",
    "Business Analytics & Intelligence",
    "Business Development & Partnerships",
    "Human Resources",
    "Talent Acquisition",
    "Customer Success",
  ]),
  cat("finance-accounting", "Finance & Accounting", [
    "Private Equity",
    "Investment Banking",
    "Venture Capital",
    "Hedge Fund",
    "Equity Research",
    "Quantitative Finance",
    "Capital Markets & Trading",
    "FP&A",
    "Real Estate",
    "Accounting",
    "Wealth Management",
    "Economic Consulting",
  ]),
  cat("arts-media-entertainment", "Arts, Media & Entertainment", [
    "Publishing & Writing",
    "Influencer & Creator",
    "Film & Television",
    "Music",
    "Comedy, Stand-Up & Improv",
    "Visual Arts",
    "Design",
    "Sports Management",
  ]),
  cat("language", "Language", [
    "English",
    "Spanish",
    "French",
    "Mandarin",
    "Japanese",
    "Korean",
    "German",
    "Italian",
    "Portuguese",
    "Arabic",
    "Russian",
    "Hindi",
    "Other Languages",
  ]),
];

/**
 * 주의 — 팀 원본 목록에는 Technology 아래 "Product Management"와 "Product"가
 * 둘 다 있었습니다. 사용자가 방을 어디에 만들지 헷갈리는 문제가 있어
 * "Product" → "Product Design"으로 바꿔 넣었습니다.
 * 팀 결정이 다르면 이 줄만 고치면 됩니다.
 *
 * "Corporate Development"는 Business와 Finance 양쪽에 있었는데
 * 중복 id 충돌을 피하려고 Business 쪽만 남겼습니다.
 */

export const SUBCATEGORIES: Subcategory[] = CATEGORIES.flatMap(
  (c) => c.subcategories
);

const SUB_BY_ID = new Map(SUBCATEGORIES.map((s) => [s.id, s]));
const CAT_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getSubcategory(id: string | null): Subcategory | null {
  return id ? SUB_BY_ID.get(id) ?? null : null;
}

export function getCategory(id: string | null): Category | null {
  return id ? CAT_BY_ID.get(id) ?? null : null;
}

/** 피커 검색용. 카테고리 이름으로도 잡히게 합니다. */
export function searchSubcategories(term: string): Subcategory[] {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  return SUBCATEGORIES.filter((s) => {
    const c = CAT_BY_ID.get(s.categoryId);
    return (
      s.label.toLowerCase().includes(q) ||
      (c ? c.label.toLowerCase().includes(q) : false)
    );
  }).slice(0, 40);
}
