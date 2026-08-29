// src/components/tokens.ts
// 디자인 토큰. Tailwind 없이도 그대로 돌아가게 인라인 스타일 객체로 둡니다.
// Tailwind를 쓴다면 이 값들을 theme.extend.colors 로 옮기세요.

export const c = {
  ground: "#FAFAF7",
  card: "#FFFFFF",
  ink: "#101613",
  ink2: "#57635C",
  ink3: "#98A29B",
  ink4: "#B4BDB6",
  hair: "#E8ECE7",
  hairSoft: "#F1F3F0",
  accent: "#146B4E",
  accentHover: "#0E5039",
  accentTint: "#EAF3EE",
  accentTint2: "#F2F6F3",
  neutralTint: "#F1F2EF",
  live: "#C8452C",
  wait: "#9A6B12",
  seatEmpty: "#C0CAC3",
} as const;

export const font = {
  display: "'Newsreader', Georgia, 'Times New Roman', serif",
  ui: "'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

export const shadow = {
  card: "0 1px 2px rgba(16,22,19,.04), 0 8px 24px -18px rgba(16,22,19,.28)",
  panel: "0 1px 2px rgba(16,22,19,.04), 0 18px 44px -20px rgba(16,22,19,.22)",
  popover: "0 1px 2px rgba(16,22,19,.05), 0 14px 34px -16px rgba(16,22,19,.28)",
} as const;

export const CONTENT_WIDTH = 1080;

/** 화면당 채워진 버튼은 하나. 그 하나에만 이 스타일을 씁니다. */
export const primaryButton: React.CSSProperties = {
  background: c.accent,
  color: "#FFFFFF",
  border: "none",
  borderRadius: 6,
  fontFamily: font.ui,
  fontWeight: 600,
  cursor: "pointer",
};

export const resetButton: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  font: "inherit",
  color: "inherit",
  cursor: "pointer",
  textAlign: "left",
};

export const label: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 10.5,
  letterSpacing: "0.14em",
  color: c.ink3,
  textTransform: "uppercase",
};
