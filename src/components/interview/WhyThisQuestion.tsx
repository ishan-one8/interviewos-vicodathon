"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

interface WhyThisQuestionProps {
  safeReason: string;
}

export function WhyThisQuestion({ safeReason }: WhyThisQuestionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 hover:text-zinc-300 transition-colors focus:outline-none"
      >
        <HelpCircle className="h-3 w-3" />
        <span>Why this question?</span>
        <ChevronDown className={`h-3 w-3 transition-transform motion-safe:duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="mt-2 px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 text-xs text-zinc-400 leading-relaxed motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
          {safeReason}
        </div>
      )}
    </div>
  );
}
