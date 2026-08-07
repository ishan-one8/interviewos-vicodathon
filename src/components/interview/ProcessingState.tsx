"use client";

import React from "react";
import { InterviewerIdentity } from "./InterviewerIdentity";

export function ProcessingState() {
  return (
    <div className="w-full bg-zinc-900/80 border border-indigo-500/30 rounded-2xl p-6 space-y-4 shadow-xl shadow-indigo-950/20 animate-in fade-in duration-200">
      <InterviewerIdentity
        size="md"
        isProcessing={true}
        statusText="Ari is evaluating your reasoning & preparing next question…"
      />

      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
          <span>Evaluating technical depth, trade-offs, and curriculum alignment...</span>
        </div>

        {/* Shimmer Placeholder Lines */}
        <div className="space-y-2">
          <div className="h-4 bg-zinc-800/80 rounded-md w-3/4 animate-pulse" />
          <div className="h-4 bg-zinc-800/60 rounded-md w-1/2 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
