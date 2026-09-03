// app/room_detail/[id]/page.tsx
import { use } from "react";
import RoomOverview from "../../../components/RoomOverview";

export default function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  return <RoomOverview roomId={resolvedParams.id} variant="detail" />;
}
