"use client";

import React, { useEffect, useRef, useState } from "react";

interface TypeRevealProps {
  text: string;
  className?: string;
  /** ms per character */
  speed?: number;
  /** delay before typing starts once in view */
  startDelay?: number;
}

/**
 * Types out text once scrolled into view. Under reduced-motion it renders the
 * full string immediately with no caret.
 */
export function TypeReveal({
  text,
  className = "",
  speed = 26,
  startDelay = 250,
}: TypeRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || started.current) return;
          started.current = true;

          if (reduced) {
            setShown(text);
            setDone(true);
            return;
          }

          const timeout = setTimeout(() => {
            let i = 0;
            const tick = () => {
              i += 1;
              setShown(text.slice(0, i));
              if (i < text.length) {
                window.setTimeout(tick, speed);
              } else {
                setDone(true);
              }
            };
            tick();
          }, startDelay);

          return () => clearTimeout(timeout);
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [text, speed, startDelay]);

  return (
    <span ref={ref} className={`${!done ? "caret" : ""} ${className}`}>
      {shown}
    </span>
  );
}
