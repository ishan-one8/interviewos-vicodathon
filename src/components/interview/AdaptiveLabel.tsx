"use client";

import React from "react";
import { Sparkles, Compass, MessageCircle, Target, Layers } from "lucide-react";

interface AdaptiveLabelProps {
  action: string;
  label: string;
}

const ACTION_STYLES: Record<string, { icon: React.ElementType; bg: string; border: string; text: string }> = {
  personalized_start: { icon: Target, bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-300" },
  follow_up: { icon: Sparkles, bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-300" },
  deepen: { icon: Target, bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-300" },
  clarify: { icon: MessageCircle, bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-300" },
  challenge: { icon: Compass, bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-300" },
  new_topic: { icon: Layers, bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-300" },
};

export function AdaptiveLabel({ action, label }: AdaptiveLabelProps) {
  const style = ACTION_STYLES[action] || ACTION_STYLES.new_topic;
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md ${style.bg} border ${style.border} ${style.text} text-[11px] font-mono font-medium`}
    >
      <Icon className="h-3 w-3" />
      {label.toUpperCase()}
    </span>
  );
}
