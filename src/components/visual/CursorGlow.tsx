"use client";

import React, { useEffect, useRef } from "react";

/**
 * Page-level ambient glow that follows the cursor. Mounts once per page.
 * Disabled implicitly under reduced-motion (the transition is neutralized and
 * we skip listener work on coarse pointers).
 */
export function CursorGlow() {
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = document.getElementById("cursor-glow-layer");
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        el.style.setProperty("--cx", `${e.clientX}px`);
        el.style.setProperty("--cy", `${e.clientY}px`);
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return <div id="cursor-glow-layer" className="cursor-glow" aria-hidden="true" />;
}
