"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface InterviewErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function InterviewError({
  message = "We couldn't process that response yet. Your answer is still here — try submitting again.",
  onRetry,
}: InterviewErrorProps) {
  return (
    <div className="w-full p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
        <span className="font-medium leading-relaxed">{message}</span>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-rose-400/50"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
