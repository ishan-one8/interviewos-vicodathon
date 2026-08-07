"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle, Award, FileText, ArrowRight } from "lucide-react";

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
    <div className="w-full max-w-2xl mx-auto p-8 rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 text-center space-y-6 shadow-2xl shadow-black/50 animate-in fade-in duration-300">
      {/* Icon Badge */}
      <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
        <CheckCircle className="h-8 w-8 stroke-[2.5]" />
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight">
          Technical Interview Complete
        </h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
          Your responses have been evaluated across multiple technical areas and curriculum days by Ari.
        </p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-center">
          <Award className="h-5 w-5 text-indigo-400 mx-auto mb-1.5" />
          <div className="text-xl font-bold text-zinc-100 font-mono">{turnCount}</div>
          <div className="text-xs text-zinc-400 font-medium">Questions Answered</div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-center">
          <FileText className="h-5 w-5 text-cyan-400 mx-auto mb-1.5" />
          <div className="text-xl font-bold text-zinc-100 font-mono">{coveredCurriculumDaysCount}</div>
          <div className="text-xs text-zinc-400 font-medium">Curriculum Areas</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={`/report?sessionId=${sessionId}`}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <span>View Interview Report</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/interview"
          className="w-full sm:w-auto px-6 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-zinc-700"
        >
          <span>Start New Interview</span>
        </Link>
      </div>
    </div>
  );
}
