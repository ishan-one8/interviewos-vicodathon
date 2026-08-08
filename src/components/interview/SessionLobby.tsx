"use client";

import React from "react";
import { InterviewerIdentity } from "./InterviewerIdentity";
import { ArrowRight, Shield } from "lucide-react";

interface SessionLobbyProps {
  candidateName: string;
  candidateRole: string;
  onBegin: () => void;
  isStarting: boolean;
}

export function SessionLobby({
  candidateName,
  candidateRole,
  onBegin,
  isStarting,
}: SessionLobbyProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-mono font-medium">
          <Shield className="h-3.5 w-3.5" />
          Session Ready
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100">
          Technical Interview
        </h1>
        <p className="text-sm text-zinc-400">
          Adaptive evaluation for <span className="text-zinc-200 font-medium">{candidateName}</span>
          <span className="text-zinc-500"> &middot; </span>
          <span className="text-zinc-300">{candidateRole}</span>
        </p>
      </div>

      {/* Interview Info Card */}
      <div className="p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <InterviewerIdentity size="md" statusText="Senior AI Systems Interviewer" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-zinc-400 text-[10px]">Format</div>
            <div className="text-zinc-200 font-semibold">8-12 Questions</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-zinc-400 text-[10px]">Curriculum</div>
            <div className="text-zinc-200 font-semibold">AI Engineering</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-zinc-400 text-[10px]">Coverage</div>
            <div className="text-zinc-200 font-semibold">4+ Areas</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-zinc-400 text-[10px]">Adaptive</div>
            <div className="text-zinc-200 font-semibold">Real-time</div>
          </div>
        </div>

        <p className="text-xs text-zinc-400 italic text-center">
          &quot;Your answers influence the questions that follow.&quot;
        </p>

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onBegin}
            disabled={isStarting}
            className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {isStarting ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Preparing...</span>
              </>
            ) : (
              <>
                <span>Begin Interview</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
