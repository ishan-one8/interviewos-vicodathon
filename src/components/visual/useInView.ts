"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns [ref, inView]. `inView` flips true once the element scrolls into
 * view (once only). Used to trigger count-ups and bar fills.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.3
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}
