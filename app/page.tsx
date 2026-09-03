// src/app/page.tsx
// 메인 화면. 서버 컴포넌트로 두고, 상호작용이 있는 두 덩어리만 클라이언트입니다.

import { SiteHeader } from "@/components/SiteHeader";
import { SentenceBuilder } from "@/components/SentenceBuilder";
import { LiveStrip } from "@/components/LiveStrip";
import { c } from "@/components/tokens";

export default function HomePage() {
  return (
    <main
      style={{
        background: c.ground,
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden", // 내부 자식이 넘쳐도 화면 전체가 옆으로 밀리는 현상 차단
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SiteHeader />
      <SentenceBuilder />
      <LiveStrip />
    </main>
  );
}
