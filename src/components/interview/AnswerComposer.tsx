"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, CornerDownLeft } from "lucide-react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
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
    // Submit on Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-lg shadow-black/30 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
        <textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting || disabled}
          placeholder="Explain your approach, reasoning, and trade-offs…"
          rows={5}
          className="w-full bg-transparent px-4 py-3.5 text-zinc-100 placeholder-zinc-500 text-sm md:text-base focus:outline-none resize-none leading-relaxed disabled:opacity-60"
        />

        {/* Bottom Toolbar inside textarea box */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-800/60 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span>{answer.length} characters</span>
            <span className="hidden sm:inline-block text-zinc-700">•</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-zinc-400">
              <CornerDownLeft className="h-3 w-3" />
              Cmd + Enter to submit
            </span>
          </div>

          <button
            type="submit"
            disabled={!answer.trim() || isSubmitting || disabled}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {isSubmitting ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <span>Submit Answer</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
