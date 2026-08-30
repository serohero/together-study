// components/RoomDetail.tsx
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  c,
  font,
  shadow,
  primaryButton,
  resetButton,
  label,
  CONTENT_WIDTH,
} from "./tokens";

/* ---------- types ---------- */

type MicState = "on" | "muted";
type Tab = "chat" | "files";

interface Participant {
  id: string;
  name: string;
  initials: string;
  isHost?: boolean;
  isSelf?: boolean;
  mic: MicState;
  cameraOn: boolean;
}

interface ChatMessage {
  id: string;
  author: string;
  self: boolean;
  time: string;
  text: string;
}

interface RoomFile {
  id: string;
  name: string;
  icon: string;
  size: string;
  owner: string;
}

interface Stage {
  key: string;
  title: string;
  icon: string;
  startMin: number;
  endMin: number;
  accentColor: string;
  tintColor: string;
  caption: string;
}

/* ---------- static data ---------- */

const WAIT_TINT = "#EDE6D7";

const STAGES: Stage[] = [
  {
    key: "icebreak",
    title: "Icebreaking",
    icon: "🧊",
    startMin: 0,
    endMin: 5,
    accentColor: c.ink2,
    tintColor: c.neutralTint,
    caption: "Icebreaking is underway — say hi and warm up together",
  },
  {
    key: "focus",
    title: "Deep Focus",
    icon: "🤫",
    startMin: 5,
    endMin: 35,
    accentColor: c.accent,
    tintColor: c.accentTint,
    caption:
      "Deep Focus is underway — stay quiet and lock in on your own work",
  },
  {
    key: "wrapup",
    title: "Wrap-up",
    icon: "💬",
    startMin: 35,
    endMin: 50,
    accentColor: c.wait,
    tintColor: WAIT_TINT,
    caption: "Wrap-up is underway — share a quick recap of what you got done",
  },
];

const TOTAL_MIN = STAGES[STAGES.length - 1].endMin;

const PARTICIPANTS: Participant[] = [
  { id: "you", name: "You", initials: "You", isSelf: true, mic: "on", cameraOn: true },
  { id: "mira", name: "Mira K.", initials: "MK", isHost: true, mic: "on", cameraOn: true },
  { id: "dan", name: "Dan R.", initials: "DR", mic: "muted", cameraOn: true },
  { id: "ana", name: "Ana P.", initials: "AP", mic: "on", cameraOn: true },
  { id: "tomas", name: "Tomas B.", initials: "TB", mic: "muted", cameraOn: false },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "m1", author: "Mira K.", self: false, time: "6:58 PM", text: "starting in a couple min — pulling up today's problem set" },
  { id: "m2", author: "Dan R.", self: false, time: "6:59 PM", text: "here 👋" },
  { id: "m3", author: "Ana P.", self: false, time: "7:01 PM", text: "joining a bit late, camera's acting up" },
  { id: "m4", author: "You", self: true, time: "7:02 PM", text: "no worries, we'll wait for you!" },
];

const FILES: RoomFile[] = [
  { id: "f1", name: "Calculus_ProblemSet_04.pdf", icon: "📄", size: "2.1 MB", owner: "Mira K." },
  { id: "f2", name: "Session_Notes_Aug29.md", icon: "📝", size: "12 KB", owner: "You" },
  { id: "f3", name: "Recording_DeepFocus.mp3", icon: "🎧", size: "34 MB", owner: "Dan R." },
  { id: "f4", name: "Weekly_Goals_Tracker.xlsx", icon: "📊", size: "48 KB", owner: "Ana P." },
];

/* ---------- breakpoint / motion hooks ---------- */

function useIsBelow(breakpoint: number) {
  const [isBelow, setIsBelow] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsBelow(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [breakpoint]);
  return isBelow;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return reduced;
}

function formatClock(totalMin: number) {
  const m = Math.floor(totalMin);
  const s = Math.floor((totalMin - m) * 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function stageAt(min: number): Stage {
  for (const stage of STAGES) {
    if (min < stage.endMin) return stage;
  }
  return STAGES[STAGES.length - 1];
}

/* ---------- root component ---------- */

export default function RoomDetail({ roomId }: { roomId: string }) {
  const isMobile = useIsBelow(720);

  const [elapsedMin, setElapsedMin] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setElapsedMin((prev) => {
        const next = prev + 1 / 60;
        return next >= TOTAL_MIN ? 0 : next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing]);

  const activeStage = useMemo(() => stageAt(elapsedMin), [elapsedMin]);
  const jumpToStage = (stage: Stage) => setElapsedMin(stage.startMin + 0.01);

  return (
    <div
      style={{
        maxWidth: CONTENT_WIDTH,
        margin: "0 auto",
        background: c.card,
        border: `1px solid ${c.hair}`,
        borderRadius: 16,
        boxShadow: shadow.panel,
        overflow: "hidden",
        fontFamily: font.ui,
        color: c.ink,
      }}
    >
      {/* glanceable stage color, visible even before reading any text */}
      <div
        style={{
          height: 4,
          width: "100%",
          flexShrink: 0,
          background: activeStage.accentColor,
          transition: "background .3s ease",
        }}
      />

      <StageBar
        roomId={roomId}
        elapsedMin={elapsedMin}
        activeStage={activeStage}
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
        onReset={() => setElapsedMin(0)}
        onJump={jumpToStage}
        isMobile={isMobile}
      />
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 18,
          padding: 18,
          alignItems: "stretch",
        }}
      >
        <VideoStage roomId={roomId} activeStage={activeStage} />
        <SidePanel isMobile={isMobile} />
      </div>
    </div>
  );
}

/* ---------- stage / timer bar ---------- */

function StageBar({
  roomId,
  elapsedMin,
  activeStage,
  playing,
  onTogglePlay,
  onReset,
  onJump,
  isMobile,
}: {
  roomId: string;
  elapsedMin: number;
  activeStage: Stage;
  playing: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onJump: (s: Stage) => void;
  isMobile: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const statusColor = playing ? c.live : c.wait;
  const statusText = playing ? "Live" : "Paused";
  const dotAnimation =
    playing && !reducedMotion ? "roomDetailLivePulse 1.6s ease-in-out infinite" : "none";

  return (
    <header
      style={{
        padding: isMobile ? "18px 18px 18px" : "26px 26px 26px",
        borderBottom: `1px solid ${c.hair}`,
        boxShadow: "0 10px 18px -16px rgba(16,22,19,.35)",
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 16 : 20,
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* keyframes for the live-status dot — no CSS file / styled-jsx needed */}
      <style>{`@keyframes roomDetailLivePulse { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }`}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: font.display, fontSize: 18, fontWeight: 650 }}>
              Dawn Study Crew
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, ...label, color: statusColor }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: statusColor,
                  animation: dotAnimation,
                }}
              />
              {statusText}
            </span>
          </div>
          {!isMobile && (
            <div style={{ fontSize: 12, color: c.ink3, marginTop: 2 }}>
              Room #{roomId} · {PARTICIPANTS.length} participants · {TOTAL_MIN}-min session
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div
            style={{
              fontFamily: font.mono,
              fontSize: isMobile ? 15 : 19,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              color: c.ink,
              background: c.ground,
              border: `1.5px solid ${activeStage.accentColor}`,
              padding: isMobile ? "6px 11px" : "8px 15px",
              borderRadius: 999,
              minWidth: isMobile ? 60 : 76,
              textAlign: "center",
              transition: "border-color .3s ease",
            }}
          >
            {formatClock(elapsedMin)}
          </div>
          <IconButton onClick={onTogglePlay} title={playing ? "Pause" : "Play"}>
            {playing ? "⏸" : "▶"}
          </IconButton>
          <IconButton onClick={onReset} title="Restart">
            ↺
          </IconButton>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        {STAGES.map((stage) => {
          const isActive = stage.key === activeStage.key;
          const isDone = elapsedMin >= stage.endMin;
          const pct =
            elapsedMin >= stage.endMin
              ? 100
              : elapsedMin <= stage.startMin
              ? 0
              : ((elapsedMin - stage.startMin) / (stage.endMin - stage.startMin)) * 100;

          return (
            <button
              key={stage.key}
              onClick={() => onJump(stage)}
              style={{
                ...resetButton,
                flex: stage.endMin - stage.startMin,
                border: `1.5px solid ${isActive ? stage.accentColor : c.hair}`,
                borderRadius: 14,
                padding: isMobile ? "14px 14px" : "17px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 9,
                background: isActive ? stage.accentColor : c.card,
                boxShadow: isActive ? shadow.card : "none",
                transform: isActive ? "translateY(-2px)" : "none",
                opacity: !isActive && isDone ? 0.68 : 1,
                transition:
                  "background .25s ease, border-color .25s ease, transform .25s ease, box-shadow .25s ease",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: isActive ? 15.5 : 14,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? "#FFFFFF" : c.ink2,
                }}
              >
                <span style={{ fontSize: isActive ? 20 : 16, lineHeight: 1 }}>{stage.icon}</span>
                {stage.title}
              </span>

              {!isMobile && (
                <span
                  style={{
                    ...label,
                    fontSize: 11,
                    fontWeight: isActive ? 600 : undefined,
                    color: isActive ? "rgba(255,255,255,0.85)" : c.ink3,
                  }}
                >
                  {stage.startMin}–{stage.endMin} min
                </span>
              )}

              <span
                style={{
                  position: "relative",
                  height: 4,
                  borderRadius: 999,
                  background: isActive ? "rgba(255,255,255,.3)" : c.hairSoft,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    inset: "0 auto 0 0",
                    width: `${pct}%`,
                    background: isActive ? "#FFFFFF" : isDone ? stage.accentColor : c.ink4,
                    borderRadius: 999,
                    transition: "width .25s linear",
                  }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

function IconButton({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        ...resetButton,
        width: 32,
        height: 32,
        borderRadius: 999,
        border: `1px solid ${c.hair}`,
        background: c.card,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
      }}
    >
      {children}
    </button>
  );
}

/* ---------- video stage (온보딩 first_name 연동 & Connecting 무한대기 해결) ---------- */

function VideoStage({ roomId, activeStage }: { roomId: string; activeStage: Stage }) {
  const router = useRouter();
  const params = useParams();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [firstName, setFirstName] = useState<string | null>(null);

  const JAAS_APP_ID = "vpaas-magic-cookie-1457a023a7a5475a994c0fdc2086bfa1";

  const rawId = (params?.id as string) || roomId || "session";
  const cleanRoomId = rawId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);

  // 1. 온보딩 profiles 테이블에서 first_name 조회 (fallback 안전 처리)
  useEffect(() => {
    async function loadFirstName() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // single() 대신 maybeSingle()을 써서 데이터가 없어도 에러 없이 통과
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.first_name && profile.first_name.trim()) {
            setFirstName(profile.first_name.trim());
            return;
          }

          // 만약 profiles 테이블에 아직 first_name 저장이 안 된 상태라면 auth metadata 활용
          const fallback =
            user.user_metadata?.first_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Member";
          setFirstName(fallback);
        } else {
          setFirstName("Member");
        }
      } catch (err) {
        console.error("Failed to load first_name:", err);
        setFirstName("Member");
      }
    }
    loadFirstName();
  }, []);

  // 2. firstName이 확정(null이 아님)되면 즉시 8x8 JaaS 렌더링
  useEffect(() => {
    if (!firstName) return;

    const script = document.createElement("script");
    script.src = `https://8x8.vc/${JAAS_APP_ID}/external_api.js`;
    script.async = true;
    document.body.appendChild(script);

    let api: any = null;

    script.onload = () => {
      if (!jitsiContainerRef.current) return;

      const domain = "8x8.vc";
      const options = {
        roomName: `${JAAS_APP_ID}/RT-${cleanRoomId}`,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        lang: "en",
        userInfo: {
          displayName: firstName, // 온보딩 first_name 주입
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          prejoinConfig: {
            enabled: false,
          },
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          defaultLanguage: "en",
        },
        interfaceConfigOverwrite: {
          DEFAULT_LANGUAGE: "en",
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
      };

      // @ts-ignore
      api = new window.JitsiMeetExternalAPI(domain, options);

      api.addEventListener("videoConferenceJoined", () => {
        api.executeCommand("displayName", firstName);
      });
    };

    return () => {
      if (api) api.dispose();
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [cleanRoomId, firstName, JAAS_APP_ID]);

  return (
    <section style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        ref={jitsiContainerRef}
        style={{
          position: "relative",
          background: c.ink,
          borderRadius: 12,
          aspectRatio: "16 / 9",
          overflow: "hidden",
          border: `1px solid ${c.hair}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!firstName && (
          <div style={{ color: "#888", fontSize: 13, fontFamily: font.ui }}>
            Connecting...
          </div>
        )}
      </div>

      <GuideBanner stage={activeStage} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <button
          onClick={() => router.push("/")}
          style={{
            ...resetButton,
            height: 40,
            padding: "0 22px",
            borderRadius: 6,
            background: c.live,
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Leave
        </button>
      </div>
    </section>
  );
}

/** Bold, colored "what's happening right now" banner — replaces the old small caption line */
function GuideBanner({ stage }: { stage: Stage }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "14px 18px",
        borderRadius: 12,
        background: stage.tintColor,
        transition: "background .3s ease",
      }}
    >
      <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{stage.icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...label, marginBottom: 3, color: stage.accentColor }}>
          Now · {stage.title}
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: c.ink, lineHeight: 1.42 }}>
          {stage.caption}
        </div>
      </div>
    </div>
  );
}

/* ---------- side panel ---------- */

function SidePanel({ isMobile }: { isMobile: boolean }) {
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <aside
      style={{
        width: isMobile ? "100%" : 328,
        flex: "0 0 auto",
        display: "flex",
        flexDirection: "column",
        background: c.ground,
        border: `1px solid ${c.hair}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <ParticipantsBlock />
      <Tabs tab={tab} onChange={setTab} />
      <div style={{ position: "relative", flex: 1, minHeight: isMobile ? 260 : 320 }}>
        {tab === "chat" ? <ChatPanel /> : <FilesPanel />}
      </div>
    </aside>
  );
}

function ParticipantsBlock() {
  return (
    <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${c.hair}`, background: c.card }}>
      <div style={{ ...label, marginBottom: 10 }}>Participants · {PARTICIPANTS.length}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {PARTICIPANTS.map((p) => (
          <div
            key={p.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: c.neutralTint,
              borderRadius: 999,
              padding: "4px 10px 4px 4px",
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 600,
                background: p.isHost ? c.accent : c.card,
                color: p.isHost ? "#FFFFFF" : c.ink2,
                border: p.isHost ? "none" : `1px solid ${c.hair}`,
              }}
            >
              {p.initials}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: c.ink }}>{p.name.split(" ")[0]}</span>
            {p.isHost && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: "#FFFFFF",
                  background: c.accent,
                  padding: "2px 5px",
                  borderRadius: 999,
                }}
              >
                HOST
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Tabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; text: string }[] = [
    { key: "chat", text: "Chat" },
    { key: "files", text: "Files" },
  ];
  return (
    <div style={{ display: "flex", position: "relative", borderBottom: `1px solid ${c.hair}`, background: c.card }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            ...resetButton,
            flex: 1,
            padding: "13px 8px 11px",
            fontSize: 13.5,
            fontWeight: 600,
            color: tab === t.key ? c.ink : c.ink3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {t.text}
        </button>
      ))}
      <span
        style={{
          position: "absolute",
          bottom: -1,
          height: 2,
          width: "50%",
          left: tab === "chat" ? 0 : "50%",
          background: c.accent,
          transition: "left .25s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    let h = now.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const time = `${h}:${String(now.getMinutes()).padStart(2, "0")} ${ampm}`;
    setMessages((prev) => [...prev, { id: String(Date.now()), author: "You", self: true, time, text }]);
    setDraft("");
  };

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div
        ref={logRef}
        style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px", display: "flex", flexDirection: "column", gap: 13 }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              maxWidth: "88%",
              alignSelf: m.self ? "flex-end" : "flex-start",
              alignItems: m.self ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: m.self ? "row-reverse" : "row",
                alignItems: "baseline",
                gap: 6,
                padding: "0 3px",
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 600, color: c.ink }}>{m.author}</span>
              <span style={{ fontSize: 10.5, color: c.ink3, fontFamily: font.mono }}>{m.time}</span>
            </div>
            <div
              style={{
                background: m.self ? c.accent : c.accentTint2,
                color: m.self ? "#FFFFFF" : c.ink,
                padding: "9px 12px",
                borderRadius: m.self ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                fontSize: 13.5,
                lineHeight: 1.45,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, padding: 10, borderTop: `1px solid ${c.hair}`, background: c.card }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message"
          style={{
            flex: 1,
            border: `1px solid ${c.hair}`,
            background: c.ground,
            borderRadius: 999,
            padding: "9px 14px",
            fontFamily: font.ui,
            fontSize: 13,
            color: c.ink,
            outline: "none",
          }}
        />
        <button onClick={send} style={{ ...primaryButton, height: 36, padding: "0 16px", fontSize: 13 }}>
          Send
        </button>
      </div>
    </div>
  );
}

function FilesPanel() {
  return (
    <ul
      style={{
        position: "absolute",
        inset: 0,
        overflowY: "auto",
        listStyle: "none",
        margin: 0,
        padding: "10px 8px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {FILES.map((f) => (
        <li key={f.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 8px", borderRadius: 10 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: c.card,
              border: `1px solid ${c.hair}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            {f.icon}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {f.name}
            </div>
            <div style={{ fontSize: 11, color: c.ink3, marginTop: 1 }}>
              {f.size} · {f.owner}
            </div>
          </div>
          <button
            style={{
              ...resetButton,
              width: 28,
              height: 28,
              borderRadius: 999,
              border: `1px solid ${c.hair}`,
              background: c.card,
              fontSize: 11,
              color: c.ink2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ↓
          </button>
        </li>
      ))}
    </ul>
  );
}
