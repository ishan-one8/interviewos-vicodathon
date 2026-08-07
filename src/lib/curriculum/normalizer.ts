import {
  CurriculumTopic,
  RawCurriculumSchema,
  RawCurriculum,
} from "@/types/interview";

export function normalizeCurriculum(raw: unknown): {
  topics: CurriculumTopic[];
  cohort: string;
  errors: string[];
} {
  const parseResult = RawCurriculumSchema.safeParse(raw);
  const errors: string[] = [];

  if (!parseResult.success) {
    errors.push(`Curriculum schema validation warnings: ${parseResult.error.message}`);
  }

  const data: RawCurriculum = parseResult.success
    ? parseResult.data
    : (raw as RawCurriculum) || { cohort: "AI Cohort", modules: [], days: [] };

  const modulesMap = new Map<number, { title: string; n: number }>();
  if (Array.isArray(data.modules)) {
    data.modules.forEach((mod) => {
      if (mod && Array.isArray(mod.days) && mod.days.length >= 2) {
        const [startDay, endDay] = mod.days;
        for (let d = startDay; d <= endDay; d++) {
          modulesMap.set(d, { title: mod.title, n: mod.n });
        }
      }
    });
  }

  const daysList = Array.isArray(data.days) ? data.days : [];
  const topics: CurriculumTopic[] = daysList.map((dayData) => {
    const dayNum = typeof dayData.day === "number" ? dayData.day : 0;
    const modInfo = modulesMap.get(dayNum) || {
      title: "General AI Engineering",
      n: 0,
    };

    return {
      id: `day-${dayNum}`,
      day: dayNum,
      module: modInfo.title,
      moduleNumber: modInfo.n,
      topic: dayData.title || `Day ${dayNum} Mission`,
      type: dayData.type || "BUILD",
      learningObjectives: Array.isArray(dayData.objectives)
        ? dayData.objectives
        : [],
      tools: Array.isArray(dayData.tools) ? dayData.tools : [],
    };
  });

  return {
    topics,
    cohort: data.cohort || "AI Cohort · 31 days · 8 modules",
    errors,
  };
}
