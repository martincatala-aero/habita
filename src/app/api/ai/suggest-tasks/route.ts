import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { getLLMProvider } from "@/lib/llm/provider";
import { SUGGEST_TASKS_SYSTEM, buildSuggestTasksPrompt } from "@/lib/llm/prompts";
import type { SuggestedTasksOutput } from "@/lib/llm/types";

import type { NextRequest } from "next/server";

const OUTPUT_SCHEMA = {
  tasks: "array of { name: string, frequency: 'daily'|'weekly'|'biweekly'|'monthly' }",
};

/**
 * POST /api/ai/suggest-tasks
 * Sugiere tareas a partir de la descripción del hogar (spec §5).
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body: unknown = await request.json();
    const householdDescription =
      typeof body === "object" &&
      body !== null &&
      "householdDescription" in body
        ? String((body as { householdDescription: unknown }).householdDescription)
        : "";

    if (!householdDescription.trim()) {
      return NextResponse.json(
        { error: "householdDescription es requerido" },
        { status: 400 }
      );
    }

    const fullPrompt = `${SUGGEST_TASKS_SYSTEM}\n\n${buildSuggestTasksPrompt(householdDescription)}`;

    const provider = getLLMProvider();
    let result: SuggestedTasksOutput;

    try {
      result = await provider.completeWithSchema<SuggestedTasksOutput>({
        prompt: fullPrompt,
        outputSchema: OUTPUT_SCHEMA,
        modelVariant: "fast",
      });
    } catch {
      result = { tasks: [] };
    }

    if (!Array.isArray(result.tasks)) {
      result = { tasks: [] };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/ai/suggest-tasks error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Error al sugerir tareas" },
      { status: 500 }
    );
  }
}
