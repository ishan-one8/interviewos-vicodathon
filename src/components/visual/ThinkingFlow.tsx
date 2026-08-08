"use client";

import React, { useEffect, useRef, useState } from "react";
import { AriCore } from "./AriCore";
import { AdaptiveLabel } from "@/components/interview/AdaptiveLabel";
import { Check } from "lucide-react";

type CoreState = "ready" | "active" | "analyzing" | "complete";

const STAGES: {
  tag: string;
  title: string;
  body: string;
  color: string;
  core: CoreState;
}[] = [
  {
    tag: "Understand",
    title: "Builds an initial interview hypothesis",
    body: "Reads the candidate's learning journey, completed missions, retry patterns, and skipped topics to form initial technical preferences — without guessing skills.",
    color: "#818cf8",
    core: "ready",
  },
  {
    tag: "Adapt",
    title: "Every answer influences the next probe",
    body: "Evaluates correctness, depth, reasoning, and practical understanding. Strong answers trigger deeper exploration; partial answers trigger clarification.",
    color: "#22d3ee",
    core: "active",
  },
  {
    tag: "Remember",
    title: "Tracks claims and context across turns",
    body: "Extracts technical claims from every answer, maintains cross-turn memory, and flags contradictions between earlier and later responses.",
    color: "#a78bfa",
    core: "analyzing",
  },
  {
    tag: "Explain",
    title: "Connects results back to observed evidence",
    body: "Every competency score links to specific answer turns and verified evidence entries. Complete provenance from question to final assessment.",
    color: "#34d399",
    core: "complete",
  },
];

function StagePreview({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {["Curriculum", "Retry patterns", "Skipped topics", "Journey"].map((t) => (
          <span key={t} className="rounded-md border border-indigo-500/20 bg-indigo-500/8 px-2 py-1 text-[10px] font-mono text-indigo-300">{t}</span>
        ))}
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="flex items-center gap-2">
        <AdaptiveLabel action="deepen" label="Deeper Probe" />
        <span className="text-[11px] text-zinc-500 font-mono">strong signal detected</span>
      </div>
    );
  }
  if (index === 2) {
    return (
      <div className="flex items-center gap-2">
        {["claim", "context", "contradiction?"].map((t, i) => (
          <React.Fragment key={t}>
            <span className="rounded-md border border-violet-500/20 bg-violet-500/8 px-2 py-1 text-[10px] font-mono text-violet-300">{t}</span>
            {i < 2 && <span className="h-px w-3 bg-violet-500/30" />}
          </React.Fragment>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      {["Reasoning · ev_q3_1", "Correctness · ev_q5_2"].map((t) => (
        <div key={t} className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/8 px-2 py-1">
          <Check className="h-3 w-3 text-emerald-400" strokeWidth={3} />
          <span className="text-[10px] font-mono text-emerald-300">{t}</span>
        </div>
      ))}
    </div>
  );
}

export function ThinkingFlow() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.idx);
            setActive(idx);
          }
        });
      },
      { threshold: 0.6, rootMargin: "-20% 0px -20% 0px" }
    );
    refs.current.forEach((r) => r && observer.observe(r));
    return () => observer.disconnect();
  }, []);

  const activeStage = STAGES[active];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
      {/* Sticky ARI core + live preview */}
      <div className="lg:sticky lg:top-28 lg:h-fit">
        <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm p-8 flex flex-col items-center text-center overflow-hidden">
          <div
            className="pointer-events-none absolute -top-16 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full transition-colors duration-700"
            style={{ background: `radial-gradient(circle, ${activeStage.color}22, transparent 70%)`, filter: "blur(28px)" }}
          />
          <AriCore state={activeStage.core} size={132} />
          <div className="mt-5 flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: activeStage.color }}>
              {String(active + 1).padStart(2, "0")}
            </span>
            <span className="text-sm font-semibold text-zinc-100">{activeStage.tag}</span>
          </div>
          <div className="mt-4 w-full max-w-xs min-h-[64px] flex items-center justify-center">
            <StagePreview index={active} />
          </div>
          {/* progress dots */}
          <div className="mt-6 flex items-center gap-2">
            {STAGES.map((s, i) => (
              <span
                key={s.tag}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: i === active ? 24 : 8,
                  background: i === active ? s.color : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-4">
        {STAGES.map((stage, i) => (
          <div
            key={stage.tag}
            data-idx={i}
            ref={(el) => { refs.current[i] = el; }}
            className={`rounded-2xl border p-6 transition-all duration-500 ${
              active === i
                ? "border-white/15 bg-[var(--surface)]/70 shadow-xl"
                : "border-[var(--border)] bg-[var(--surface)]/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                {active === i && (
                  <span className="absolute h-2.5 w-2.5 rounded-full" style={{ background: stage.color, opacity: 0.3, animation: "glow-pulse 2s ease-in-out infinite" }} />
                )}
                <span className="h-1.5 w-1.5 rounded-full transition-all" style={{ background: active === i ? stage.color : "#3f3f46", boxShadow: active === i ? `0 0 8px ${stage.color}` : "none" }} />
              </span>
              <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: active === i ? stage.color : "#71717a" }}>
                {String(i + 1).padStart(2, "0")} · {stage.tag}
              </span>
            </div>
            <h3 className={`text-lg md:text-xl font-semibold transition-colors ${active === i ? "text-zinc-50" : "text-zinc-400"}`}>
              {stage.title}
            </h3>
            <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{stage.body}</p>
            {/* inline preview for mobile */}
            <div className="mt-4 lg:hidden">
              <StagePreview index={i} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
