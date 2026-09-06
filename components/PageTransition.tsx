// components/PageTransition.tsx
// 페이지가 바뀔 때 크로스페이드(정확히는 빠져나가기 -> 들어오기, 블러+스케일 포함) 전환을 걸어주는 래퍼.
// Next.js App Router는 기본 전환 효과가 없어서 layout.tsx에서 children을 이걸로 한 번 감싸서 씁니다.
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const TRANSITION_MS = 220;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [stage, setStage] = useState<"visible" | "leaving">("visible");
  const prevPathname = useRef(pathname);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    try {
      reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reducedMotionRef.current = false;
    }
  }, []);

  useEffect(() => {
    // 경로가 안 바뀌었으면 (같은 페이지 안에서 내용만 바뀐 경우) 전환 없이 바로 갱신
    if (prevPathname.current === pathname) {
      setDisplayChildren(children);
      return;
    }
    prevPathname.current = pathname;

    if (reducedMotionRef.current) {
      setDisplayChildren(children);
      return;
    }

    setStage("leaving");
    const timer = window.setTimeout(() => {
      setDisplayChildren(children);
      setStage("visible");
    }, TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, children]);

  const leaving = stage === "leaving";

  return (
    <div
      style={{
        opacity: leaving ? 0 : 1,
        transform: leaving ? "scale(1.01)" : "scale(1)",
        filter: leaving ? "blur(4px)" : "blur(0px)",
        transition:
          `opacity ${TRANSITION_MS}ms cubic-bezier(0.77, 0, 0.175, 1), ` +
          `transform ${TRANSITION_MS}ms cubic-bezier(0.77, 0, 0.175, 1), ` +
          `filter ${TRANSITION_MS}ms cubic-bezier(0.77, 0, 0.175, 1)`,
      }}
    >
      {displayChildren}
    </div>
  );
}
