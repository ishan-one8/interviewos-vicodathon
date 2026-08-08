"use client";

import React from "react";
import { ProductMockup } from "./ProductMockup";
import { AriCore } from "./AriCore";
import { AdaptiveLabel } from "@/components/interview/AdaptiveLabel";

/** Illustrative product mockups (static example content, clearly marketing). */

function InterviewMockup() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AdaptiveLabel action="deepen" label="Deeper Probe" />
        <span className="text-[9px] font-mono text-zinc-600">Vector Search · Advanced</span>
      </div>
      <p className="text-[13px] text-zinc-100 leading-relaxed">
        How would you distinguish an embedding-quality issue from an index-recall problem?
      </p>
      <div className="rounded-lg border border-indigo-500/25 bg-[var(--background)] p-2.5">
        <div className="text-[9px] font-mono text-zinc-600 uppercase mb-1">Your Response</div>
        <div className="h-1.5 w-3/4 rounded bg-zinc-800 mb-1.5" />
        <div className="h-1.5 w-1/2 rounded bg-zinc-800/60" />
      </div>
    </div>
  );
}

function ReportMockup() {
  return (
    <div className="p-4 flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-[225deg]">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" strokeDasharray="188 251" strokeLinecap="round" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="url(#scGrad)" strokeWidth="7" strokeDasharray="165 251" strokeLinecap="round" />
          <defs>
            <linearGradient id="scGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold font-mono text-zinc-50">88</span>
          <span className="text-[8px] font-mono text-indigo-300 uppercase">Advanced</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {[["Correctness", "100%", "100%"], ["Depth", "75%", "75%"], ["Reasoning", "82%", "82%"]].map(([label, , w]) => (
          <div key={label}>
            <div className="flex justify-between text-[9px] font-mono text-zinc-500 mb-0.5"><span>{label}</span></div>
            <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: w, background: "linear-gradient(90deg,#6366f1,#22d3ee)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReplayMockup() {
  const turns = [
    { q: "Q1", label: "Personalized Start", color: "#22d3ee" },
    { q: "Q2", label: "Deeper Probe", color: "#a78bfa" },
    { q: "Q3", label: "New Area", color: "#818cf8" },
  ];
  return (
    <div className="p-4">
      <div className="relative ml-2 pl-4 space-y-3">
        <div className="absolute left-0 top-1 bottom-1 w-px bg-gradient-to-b from-indigo-500/60 via-cyan-500/40 to-transparent" />
        {turns.map((t) => (
          <div key={t.q} className="relative">
            <span className="absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full bg-[var(--surface)] border-2 flex items-center justify-center" style={{ borderColor: t.color }}>
              <span className="h-1 w-1 rounded-full" style={{ background: t.color }} />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-indigo-400">{t.q}</span>
              <span className="text-[10px] font-mono" style={{ color: t.color }}>{t.label}</span>
            </div>
            <div className="mt-1 h-1 w-2/3 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductShowcase() {
  return (
    <>
      {/* Desktop layered composition */}
      <div className="hidden lg:block relative h-[460px]">
        <div className="absolute left-0 top-8 w-[380px] float-persp-a" style={{ zIndex: 2 }}>
          <ProductMockup title="interviewos — adaptive interview">
            <InterviewMockup />
          </ProductMockup>
        </div>
        <div className="absolute right-0 top-0 w-[360px] float-persp-b" style={{ zIndex: 3 }}>
          <ProductMockup title="interviewos — evidence report">
            <ReportMockup />
          </ProductMockup>
        </div>
        <div className="absolute left-1/2 bottom-0 w-[320px] -translate-x-1/3 float-persp-a" style={{ zIndex: 4, animationDelay: "-3s" }}>
          <ProductMockup title="interviewos — interview replay">
            <ReplayMockup />
          </ProductMockup>
        </div>
        {/* central ambient ARI */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60" style={{ zIndex: 1 }}>
          <AriCore state="active" size={120} />
        </div>
      </div>

      {/* Mobile stack */}
      <div className="lg:hidden space-y-4">
        <ProductMockup title="adaptive interview"><InterviewMockup /></ProductMockup>
        <ProductMockup title="evidence report"><ReportMockup /></ProductMockup>
        <ProductMockup title="interview replay"><ReplayMockup /></ProductMockup>
      </div>
    </>
  );
}
