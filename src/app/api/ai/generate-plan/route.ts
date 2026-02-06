import { NextResponse } from "next/server";
import { requireMember } from "@/lib/session";
import { generateAndApplyPlan } from "@/lib/llm/ai-planner";
import { isAIEnabled } from "@/lib/llm/provider";

/**
 * POST /api/ai/generate-plan
 * Generate and apply an AI-powered task distribution plan.
 * This creates actual assignments in the database.
 */
export async function POST() {
  try {
    const member = await requireMember();

    if (!isAIEnabled()) {
      return NextResponse.json(
        { error: "AI features not configured. Set GOOGLE_GENERATIVE_AI_API_KEY or ANTHROPIC_API_KEY." },
        { status: 503 }
      );
    }

    const result = await generateAndApplyPlan(member.householdId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/ai/generate-plan error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Error generating plan" },
      { status: 500 }
    );
  }
}
