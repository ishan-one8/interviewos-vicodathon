"use client";

import React, { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  /** Stagger delay in ms */
  delay?: number;
  className?: string;
  /** Render as a different element */
  as?: keyof React.JSX.IntrinsicElements;
  /** Only reveal once (default true) */
  once?: boolean;
}

/**
 * Scroll-triggered reveal. Adds `.is-visible` when the element enters the
 * viewport, driving the CSS `.reveal` transition. Respects reduced-motion via
 * the global CSS override (which forces visible state).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
