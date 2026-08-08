"use client";

import React, { useRef } from "react";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** enable subtle 3D tilt toward the cursor */
  tilt?: boolean;
  as?: "div" | "button";
  className?: string;
}

/**
 * Card with a cursor-reactive radial spotlight (via the `.spotlight` CSS) and
 * optional subtle tilt. Purely presentational depth cue.
 */
export function SpotlightCard({
  children,
  tilt = false,
  as = "div",
  className = "",
  ...rest
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    if (tilt) {
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg)`;
    }
  };

  const onLeave = () => {
    const el = ref.current;
    if (el && tilt) el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  };

  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`spotlight ${tilt ? "transition-transform duration-300 ease-out" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
