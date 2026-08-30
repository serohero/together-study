// app/study_room/[[...id]]/page.tsx
"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { c } from "../../../components/tokens";

// SSR 끄고 안전하게 마운트
const RoomDetail = dynamic(() => import("../../../components/RoomDetail"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        padding: "60px 20px",
        textAlign: "center",
        color: "#888",
        fontSize: "14px",
      }}
    >
      Loading Study Room...
    </div>
  ),
});

export default function RoomPage({
  params,
}: {
  params: Promise<{ id?: string[] }> | { id?: string[] };
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  
  // /study_room 일 때는 id가 undefined이므로 기본값 "session-1" 적용
  // /study_room/123 일 때는 ["123"] 배열의 첫 번째 값 사용
  const roomId = resolvedParams?.id?.[0] || "session-1";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: c.ground,
        padding: "28px 16px 60px",
      }}
    >
      <RoomDetail roomId={roomId} />
    </main>
  );
}