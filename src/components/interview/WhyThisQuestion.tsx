"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface WhyThisQuestionProps {
  safeReason: string;
}

export function WhyThisQuestion({ safeReason }: WhyThisQuestionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors font-mono focus:outline-none"
      >
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        <span>Why this question?</span>
      </button>

      {isOpen && (
        <div className="mt-2 px-3 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-zinc-400 leading-relaxed animate-fade-in">
          {safeReason}
        </div>
      )}
    </div>
  );
}
