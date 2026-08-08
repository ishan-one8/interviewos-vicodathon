"use client";

import React from "react";
import Link from "next/link";
import { AriCore } from "@/components/visual/AriCore";
import { ArrowRight } from "lucide-react";

interface CompletionStateProps {
  sessionId: string;
  turnCount: number;
  coveredCurriculumDaysCount: number;
}

export function CompletionState({
  sessionId,
  turnCount,
  coveredCurriculumDaysCount,
}: CompletionStateProps) {
  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6 animate-scale-in">
      <AriCore state="complete" size={96} className="mx-auto" />

      <div className="space-y-2">
        <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
          Interview Complete
        </div>
        <h2 className="text-2xl font-bold text-zinc-50">
          Assessment ready
        </h2>
        <p className="text-sm text-zinc-500">
          {turnCount} questions answered across {coveredCurriculumDaysCount} curriculum areas.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href={`/report?sessionId=${sessionId}`}
          className="group relative overflow-hidden w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 shadow-lg shadow-indigo-600/25"
        >
          <span className="beam" />
          <span className="relative">View Report</span>
          <ArrowRight className="relative h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/demo"
          className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[var(--border)] hover:border-indigo-500/40 text-zinc-400 hover:text-zinc-200 text-sm transition-colors flex items-center justify-center focus:outline-none"
        >
          New Interview
        </Link>
      </div>
    </div>
  );
}
