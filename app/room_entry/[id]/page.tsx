// app/room_entry/[id]/page.tsx
"use client";

import { use } from "react";
import dynamic from "next/dynamic";

// SSR 끄고 안전하게 마운트 (countdown/Date 로직이 클라이언트 전용)
const RoomOverview = dynamic(() => import("../../../components/RoomOverview"), {
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
      Loading...
    </div>
  ),
});

export default function RoomEntryPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  return <RoomOverview roomId={resolvedParams.id} variant="entry" />;
}
