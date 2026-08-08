"use client";

import React from "react";

type AriState = "ready" | "active" | "analyzing" | "complete";

interface AriCoreProps {
  state?: AriState;
  /** pixel size of the core */
  size?: number;
  className?: string;
}

const STATE_COLORS: Record<AriState, { core: string; ring: string; glow: string }> = {
  ready: { core: "#818cf8", ring: "rgba(129,140,248,0.5)", glow: "rgba(99,102,241,0.5)" },
  active: { core: "#22d3ee", ring: "rgba(34,211,238,0.5)", glow: "rgba(34,211,238,0.5)" },
  analyzing: { core: "#a78bfa", ring: "rgba(167,139,250,0.55)", glow: "rgba(139,92,246,0.55)" },
  complete: { core: "#34d399", ring: "rgba(52,211,153,0.5)", glow: "rgba(16,185,129,0.5)" },
};

/**
 * Abstract animated AI system core — concentric rings, orbiting nodes and a
 * breathing gradient center. No face, robot, or brain imagery. States tune the
 * accent color and motion energy.
 */
export function AriCore({ state = "ready", size = 88, className = "" }: AriCoreProps) {
  const c = STATE_COLORS[state];
  const isAnalyzing = state === "analyzing";

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${c.glow}, transparent 65%)`,
          filter: "blur(10px)",
          animation: "glow-pulse 3.2s ease-in-out infinite",
        }}
      />

      {/* Pulse rings */}
      <div
        className="absolute inset-0 rounded-full border"
        style={{ borderColor: c.ring, animation: "pulse-ring 2.8s ease-out infinite" }}
      />
      <div
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: c.ring,
          animation: "pulse-ring 2.8s ease-out infinite",
          animationDelay: "1.4s",
        }}
      />

      {/* Orbit rings with nodes */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <g style={{ transformOrigin: "50px 50px", animation: `spin-slow ${isAnalyzing ? 7 : 16}s linear infinite` }}>
          <circle cx="50" cy="50" r="34" fill="none" stroke={c.ring} strokeWidth="0.6" strokeDasharray="3 5" opacity="0.6" />
          <circle cx="50" cy="16" r="2.4" fill={c.core} />
        </g>
        <g style={{ transformOrigin: "50px 50px", animation: `spin-rev ${isAnalyzing ? 9 : 22}s linear infinite` }}>
          <circle cx="50" cy="50" r="24" fill="none" stroke={c.ring} strokeWidth="0.6" opacity="0.45" />
          <circle cx="74" cy="50" r="1.8" fill={c.core} />
          <circle cx="26" cy="50" r="1.4" fill={c.core} opacity="0.7" />
        </g>
      </svg>

      {/* Breathing core */}
      <div
        className="absolute rounded-full"
        style={{
          inset: "36%",
          background: `radial-gradient(circle at 40% 35%, #ffffff 0%, ${c.core} 45%, transparent 75%)`,
          boxShadow: `0 0 18px 2px ${c.glow}`,
          animation: "core-breathe 3s ease-in-out infinite",
        }}
      />
    </div>
  );
}
