"use client";

import React from "react";

export function ReportSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-pulse p-4">
      {/* Header Skeleton */}
      <div className="h-64 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 space-y-4">
        <div className="h-4 bg-zinc-800 rounded w-1/4" />
        <div className="h-8 bg-zinc-800 rounded w-1/2" />
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
      </div>

      {/* Competencies Skeleton */}
      <div className="h-80 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-6">
        <div className="h-6 bg-zinc-800 rounded w-1/3" />
        <div className="space-y-4">
          <div className="h-12 bg-zinc-800/80 rounded-2xl" />
          <div className="h-12 bg-zinc-800/80 rounded-2xl" />
          <div className="h-12 bg-zinc-800/80 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
