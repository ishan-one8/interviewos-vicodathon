"use client";

import React from "react";
import { AriCore } from "@/components/visual/AriCore";
import { ArrowRight } from "lucide-react";

interface SessionLobbyProps {
  candidateName: string;
  candidateRole: string;
  onBegin: () => void;
  isStarting: boolean;
}

const CONTEXT_LABELS = [
  { label: "8+ Adaptive Questions", top: "4%", left: "2%", delay: "0s", color: "text-indigo-300" },
  { label: "4+ Curriculum Areas", top: "10%", right: "2%", delay: "-1.5s", color: "text-cyan-300" },
  { label: "Cross-turn Memory", bottom: "8%", left: "4%", delay: "-2.4s", color: "text-violet-300" },
  { label: "Evidence-backed Assessment", bottom: "2%", right: "3%", delay: "-3.1s", color: "text-emerald-300" },
];

export function SessionLobby({
  candidateName,
  candidateRole,
  onBegin,
  isStarting,
}: SessionLobbyProps) {
  return (
    <div className="w-full max-w-2xl mx-auto text-center animate-fade-in">
      {/* ARI stage with floating context labels */}
      <div className="relative mx-auto mb-8 h-64 w-full max-w-md">
        {CONTEXT_LABELS.map((c) => (
          <div
            key={c.label}
            className="float-slow absolute"
            style={{ top: c.top, bottom: c.bottom, left: c.left, right: c.right, animationDelay: c.delay }}
          >
            <span className={`rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-mono backdrop-blur-md shadow-lg shadow-black/40 ${c.color}`}>
              {c.label}
            </span>
          </div>
        ))}

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AriCore state="ready" size={128} />
          <div className="mt-4 flex items-center gap-2">
            <span className="text-base font-semibold text-zinc-100">Ari</span>
            <span className="text-[10px] font-mono uppercase tracking-wide px-1.5 py-px rounded bg-zinc-800/60 text-zinc-500 border border-zinc-700/40">
              AI Systems Interviewer
            </span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            READY
          </div>
        </div>
      </div>

      {/* Welcome copy */}
      <div className="space-y-2 mb-8">
        <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
          Technical Interview
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
          Welcome, {candidateName.split(" ")[0]}
        </h1>
        <p className="text-sm text-zinc-500">{candidateRole}</p>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto pt-2 leading-relaxed">
          No fixed script. Your answers influence what comes next.
        </p>
      </div>

      <button
        type="button"
        onClick={onBegin}
        disabled={isStarting}
        className="group relative overflow-hidden px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2 mx-auto focus:outline-none focus:ring-2 focus:ring-indigo-400/50 shadow-lg shadow-indigo-600/25"
      >
        {isStarting ? (
          <>
            <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Preparing...</span>
          </>
        ) : (
          <>
            <span className="beam" />
            <span className="relative">Begin Interview</span>
            <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </div>
  );
}
