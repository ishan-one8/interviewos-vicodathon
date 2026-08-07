import { QuestionPlan, InterviewQuestion } from "@/types/interview";

export function buildPlaceholderQuestion(plan: QuestionPlan): InterviewQuestion {
  let text = "";

  switch (plan.difficulty) {
    case "foundation":
      text = `Explain the core purpose of ${plan.topic} and how it operates within an AI system.`;
      break;
    case "intermediate":
      text = `Walk me through how you would practically implement ${plan.topic} in a production workflow.`;
      break;
    case "advanced":
      text = `What key design decisions and performance factors matter most when configuring ${plan.topic}, and why?`;
      break;
    case "debugging":
      text = `A production pipeline using ${plan.topic} is failing or delivering low-quality output. How would you systematically diagnose and fix it?`;
      break;
    case "architecture":
      text = `Architect a scalable production service featuring ${plan.topic} as a central component. What architectural trade-offs would you accept?`;
      break;
    case "tradeoff":
      text = `Compare two reasonable alternative architectural patterns for ${plan.topic}. Under what specific constraints would you choose each?`;
      break;
    default:
      text = `Discuss your experience and key technical insights regarding ${plan.topic}.`;
  }

  return {
    id: `q_planned_${plan.curriculumDay}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    text,
    curriculumDay: plan.curriculumDay,
    topic: plan.topic,
    difficulty: plan.difficulty,
    action: plan.action,
    reasonForQuestion: plan.reasonForSelection,
    basedOnQuestionId: plan.basedOnQuestionId,
    createdAt: new Date().toISOString(),
  };
}
