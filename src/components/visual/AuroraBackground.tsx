"use client";

import React from "react";

interface AuroraBackgroundProps {
  /** Visual intensity of the aurora field */
  variant?: "hero" | "subtle" | "panel";
  /** Show the faint signal grid overlay */
  grid?: boolean;
  className?: string;
}

/**
 * Layered atmospheric background — blurred aurora blobs + optional signal grid
 * + noise. Purely decorative; sits behind content with pointer-events disabled.
 */
export function AuroraBackground({
  variant = "subtle",
  grid = true,
  className = "",
}: AuroraBackgroundProps) {
  const isHero = variant === "hero";
  const isPanel = variant === "panel";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Aurora blobs */}
      <div
        className="aurora-blob aurora-a"
        style={{
          top: isHero ? "-10%" : "-20%",
          left: isHero ? "8%" : "-5%",
          width: isHero ? "46%" : "38%",
          height: isHero ? "55%" : "45%",
          background:
            "radial-gradient(circle at 40% 40%, var(--aurora-1), transparent 68%)",
          opacity: isPanel ? 0.5 : 1,
        }}
      />
      <div
        className="aurora-blob aurora-b"
        style={{
          top: isHero ? "12%" : "0%",
          right: isHero ? "-4%" : "-10%",
          width: isHero ? "42%" : "36%",
          height: isHero ? "50%" : "44%",
          background:
            "radial-gradient(circle at 50% 50%, var(--aurora-2), transparent 66%)",
          opacity: isPanel ? 0.45 : 0.9,
        }}
      />
      <div
        className="aurora-blob aurora-a"
        style={{
          bottom: "-18%",
          left: "26%",
          width: isHero ? "40%" : "34%",
          height: isHero ? "48%" : "42%",
          background:
            "radial-gradient(circle at 50% 50%, var(--aurora-3), transparent 68%)",
          animationDelay: "-8s",
          opacity: isPanel ? 0.4 : 0.85,
        }}
      />
      {isHero && (
        <div
          className="aurora-blob aurora-b"
          style={{
            top: "35%",
            left: "45%",
            width: "30%",
            height: "34%",
            background:
              "radial-gradient(circle at 50% 50%, var(--aurora-4), transparent 70%)",
            animationDelay: "-14s",
          }}
        />
      )}

      {/* Signal grid */}
      {grid && <div className="signal-grid absolute inset-0" />}

      {/* Noise */}
      <div className="noise-overlay absolute inset-0" />

      {/* Bottom fade into page background for seamless section blending */}
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--background))",
        }}
      />
    </div>
  );
}
