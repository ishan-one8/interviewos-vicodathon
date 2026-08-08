"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AriCore } from "./AriCore";

/** Node geometry expressed in the 400×400 SVG user space. */
const NODES = [
  { key: "context", label: "Candidate Context", x: 200, y: 52, color: "#818cf8" },
  { key: "signal", label: "Response Signal", x: 342, y: 134, color: "#22d3ee" },
  { key: "evidence", label: "Evidence", x: 342, y: 266, color: "#34d399" },
  { key: "probe", label: "Next Probe", x: 200, y: 348, color: "#a78bfa" },
  { key: "memory", label: "Memory", x: 58, y: 266, color: "#f0abfc" },
  { key: "strategy", label: "Interview Strategy", x: 58, y: 134, color: "#818cf8" },
] as const;

const CENTER = { x: 200, y: 200 };

/** Floating product-preview panels around the core (perspective + drift). */
const CHIPS = [
  { label: "FOLLOW-UP", body: "Let's go deeper into retrieval quality.", top: "-4%", left: "60%", dot: "#818cf8", accent: "text-indigo-300", persp: "a", delay: "0s" },
  { label: "EVIDENCE ADDED", body: "Reasoning signal captured", top: "76%", left: "62%", dot: "#34d399", accent: "text-emerald-300", persp: "b", delay: "-2s" },
  { label: "CURRENT AREA", body: "Vector Search", top: "84%", left: "-10%", dot: "#22d3ee", accent: "text-cyan-300", persp: "a", delay: "-3.4s" },
  { label: "MEMORY", body: "Claim retained across turns", top: "4%", left: "-14%", dot: "#a78bfa", accent: "text-violet-300", persp: "b", delay: "-1.2s" },
];

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false
  );
}

export function AdaptiveCore() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const reduced = usePrefersReducedMotion();
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) return;
    const el = wrapRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => setParallax({ x: px, y: py }));
    };
    const onLeave = () => setParallax({ x: 0, y: 0 });

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [reduced]);

  // Parallax layer transforms (px)
  const layer = (depth: number) => ({
    transform: `translate3d(${parallax.x * depth}px, ${parallax.y * depth}px, 0)`,
    transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
  });

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto aspect-square w-full max-w-[440px]"
    >
      {/* Ambient back glow (deepest parallax layer) */}
      <div className="absolute inset-0" style={layer(-8)}>
        <div
          className="absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.22), rgba(34,211,238,0.08) 45%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />
      </div>

      {/* Connector paths + particles (mid layer) */}
      <div className="absolute inset-0" style={layer(10)}>
        <svg viewBox="0 0 400 400" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="connGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(129,140,248,0.55)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.15)" />
            </linearGradient>
          </defs>

          {NODES.map((n, i) => {
            const mx = (CENTER.x + n.x) / 2 + (n.y - CENTER.y) * 0.12;
            const my = (CENTER.y + n.y) / 2 - (n.x - CENTER.x) * 0.12;
            const d = `M${CENTER.x},${CENTER.y} Q${mx},${my} ${n.x},${n.y}`;
            return (
              <g key={n.key}>
                <path
                  id={`conn-${n.key}`}
                  d={d}
                  fill="none"
                  stroke="url(#connGrad)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  className="draw-path is-visible"
                  style={{ animationDelay: `${i * 140}ms` }}
                />
                {/* Traveling signal particle (SMIL — skipped under reduced motion) */}
                {!reduced && (
                  <circle r="2.6" fill={n.color}>
                    <animateMotion
                      dur={`${2.8 + i * 0.35}s`}
                      begin={`${i * 0.4}s`}
                      repeatCount="indefinite"
                      keyPoints="0;1"
                      keyTimes="0;1"
                      calcMode="spline"
                      keySplines="0.4 0 0.2 1"
                    >
                      <mpath href={`#conn-${n.key}`} />
                    </animateMotion>
                    <animate
                      attributeName="opacity"
                      dur={`${2.8 + i * 0.35}s`}
                      begin={`${i * 0.4}s`}
                      repeatCount="indefinite"
                      values="0;1;1;0"
                      keyTimes="0;0.1;0.85;1"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node dots + labels (upper mid layer) */}
      <div className="absolute inset-0" style={layer(16)}>
        {NODES.map((n, i) => {
          const leftPct = (n.x / 400) * 100;
          const topPct = (n.y / 400) * 100;
          return (
            <div
              key={n.key}
              className="absolute animate-scale-in"
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                transform: "translate(-50%, -50%)",
                animationDelay: `${400 + i * 110}ms`,
              }}
            >
              <span className="relative flex h-3.5 w-3.5 items-center justify-center" title={n.label}>
                <span
                  className="absolute h-3.5 w-3.5 rounded-full"
                  style={{ background: n.color, opacity: 0.22, animation: "glow-pulse 2.6s ease-in-out infinite", animationDelay: `${i * 300}ms` }}
                />
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: n.color, boxShadow: `0 0 9px ${n.color}` }}
                />
              </span>
            </div>
          );
        })}
      </div>

      {/* ARI core (front-most parallax) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={layer(22)}
      >
        <AriCore state="active" size={110} />
        <div className="mt-1 text-center">
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-cyan-300">
            Ari
          </span>
        </div>
      </div>

      {/* Floating product-preview panels (hidden on small screens to avoid overflow) */}
      <div className="absolute inset-0 hidden sm:block" style={layer(30)}>
        {CHIPS.map((chip) => (
          <div
            key={chip.label}
            className={`absolute ${chip.persp === "a" ? "float-persp-a" : "float-persp-b"}`}
            style={{ top: chip.top, left: chip.left, animationDelay: chip.delay }}
          >
            <div className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5 backdrop-blur-xl shadow-2xl shadow-black/50 min-w-[120px] max-w-[168px]">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: chip.dot }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: chip.dot, boxShadow: `0 0 6px ${chip.dot}` }} />
                </span>
                <span className={`text-[9px] font-mono uppercase tracking-wider ${chip.accent}`}>{chip.label}</span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-300 leading-snug">{chip.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
