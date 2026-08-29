// src/hooks/useDismissable.ts
// 팝오버/패널 공통 동작: 바깥 클릭, ESC, 열릴 때 포커스 이동.

"use client";

import { useEffect, useRef } from "react";

export function useDismissable<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
  opts: { focusOnOpen?: boolean } = {}
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent | TouchEvent) {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !opts.focusOnOpen) return;
    const el = ref.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(
      "input, button, [tabindex]:not([tabindex='-1'])"
    );
    target?.focus();
  }, [open, opts.focusOnOpen]);

  return ref;
}
