import { NextResponse } from "next/server";
import { getCandidates } from "@/lib/data";
import type { DemoCandidateCard } from "@/types/session-dto";

export async function GET() {
  try {
    const { candidates } = getCandidates();

    const cards: DemoCandidateCard[] = candidates.map((c) => ({
      id: c.id,
      name: c.name,
      jobRole: c.jobRole,
      yearsExperience: c.yearsExperience,
      education: c.education,
    }));

    return NextResponse.json({ success: true, candidates: cards });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load candidate profiles." },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
