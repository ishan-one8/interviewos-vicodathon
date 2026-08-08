"use client";

import React from "react";

export function ReportSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-pulse p-4">
      <div className="h-56 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 space-y-4">
        <div className="h-3 bg-zinc-800 rounded w-1/4" />
        <div className="h-7 bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-zinc-800 rounded w-1/3" />
      </div>

      <div className="h-64 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 space-y-5">
        <div className="h-5 bg-zinc-800 rounded w-1/3" />
        <div className="space-y-3">
          <div className="h-10 bg-zinc-800/60 rounded-lg" />
          <div className="h-10 bg-zinc-800/60 rounded-lg" />
          <div className="h-10 bg-zinc-800/60 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
