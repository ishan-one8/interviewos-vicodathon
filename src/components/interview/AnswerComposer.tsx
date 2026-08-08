"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowUp, CornerDownLeft } from "lucide-react";

interface AnswerComposerProps {
  onSubmitAnswer: (answer: string) => void;
  isSubmitting: boolean;
  disabled?: boolean;
}

export function AnswerComposer({
  onSubmitAnswer,
  isSubmitting,
  disabled = false,
}: AnswerComposerProps) {
  const [answer, setAnswer] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed || isSubmitting || disabled) return;
    onSubmitAnswer(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="focus-glow relative rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm transition-all duration-300">
        {/* Active typing accent bar */}
        <div
          className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full transition-all duration-300"
          style={{
            background: focused || answer ? "linear-gradient(to bottom, #8b5cf6, #22d3ee)" : "transparent",
            opacity: focused || answer ? 1 : 0,
          }}
        />

        <div className="flex items-center gap-2 px-4 pt-3.5 text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
          <span className="h-1 w-1 rounded-full bg-indigo-400" />
          Your Response
        </div>

        <textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={isSubmitting || disabled}
          placeholder="Explain your approach, assumptions, and trade-offs..."
          rows={6}
          className="w-full bg-transparent px-4 py-3 text-zinc-100 placeholder-zinc-700 text-sm md:text-base focus:outline-none resize-none leading-relaxed disabled:opacity-50"
        />

        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] text-[11px] text-zinc-600 font-mono">
          <div className="flex items-center gap-3">
            <span className={answer.length > 0 ? "text-zinc-400" : ""}>{answer.length} chars</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-zinc-700">
              <CornerDownLeft className="h-2.5 w-2.5" />
              Cmd+Enter
            </span>
          </div>

          <button
            type="submit"
            disabled={!answer.trim() || isSubmitting || disabled}
            className="group relative overflow-hidden px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white text-xs font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
          >
            {isSubmitting ? (
              <>
                <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Evaluating</span>
              </>
            ) : (
              <>
                <span className="relative">Submit</span>
                <ArrowUp className="relative h-3 w-3 transition-transform group-hover:-translate-y-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
