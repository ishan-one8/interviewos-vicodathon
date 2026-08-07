import { DifficultyLevel } from "@/types/interview";

const DIFFICULTY_ORDER: DifficultyLevel[] = [
  "foundation",
  "intermediate",
  "advanced",
  "debugging",
  "architecture",
  "tradeoff",
];

export function increaseDifficulty(level: DifficultyLevel): DifficultyLevel {
  const index = DIFFICULTY_ORDER.indexOf(level);
  if (index === -1 || index >= DIFFICULTY_ORDER.length - 1) {
    return level;
  }
  return DIFFICULTY_ORDER[index + 1];
}

export function decreaseDifficulty(level: DifficultyLevel): DifficultyLevel {
  const index = DIFFICULTY_ORDER.indexOf(level);
  if (index <= 0) {
    return level === "foundation" ? "foundation" : "foundation";
  }
  return DIFFICULTY_ORDER[index - 1];
}
