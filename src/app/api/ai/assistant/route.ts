import { NextResponse } from "next/server";
import { requireMember } from "@/lib/session";
import { getLLMProvider } from "@/lib/llm/provider";
import { buildAssistantPrompt } from "@/lib/llm/prompts";
import { buildAssistantContext } from "@/lib/llm/assistant-context";
import type { AssistantOutput } from "@/lib/llm/types";

import type { NextRequest } from "next/server";

const OUTPUT_SCHEMA = {
  answer: "string (respuesta principal)",
  suggestion: "string opcional (sugerencia accionable)",
};

/**
 * POST /api/ai/assistant
 * Asistente de preguntas (spec §4). Responde en el idioma de la pregunta.
 */
export async function POST(request: NextRequest) {
  try {
    const member = await requireMember();

    const body: unknown = await request.json();
    const question =
      typeof body === "object" && body !== null && "question" in body
        ? String((body as { question: unknown }).question)
        : "";

    if (!question.trim()) {
      return NextResponse.json(
        { error: "question es requerido" },
        { status: 400 }
      );
    }

    const context = await buildAssistantContext(
      member.householdId,
      member.name
    );
    const prompt = buildAssistantPrompt({ ...context, question });

    const provider = getLLMProvider();
    let result: AssistantOutput;

    try {
      result = await provider.completeWithSchema<AssistantOutput>({
        prompt: `${prompt}\n\nResponde en JSON con "answer" y opcionalmente "suggestion".`,
        outputSchema: OUTPUT_SCHEMA,
        modelVariant: "standard",
      });
    } catch {
      result = {
        answer:
          "No pude procesar esa pregunta. Intenta de nuevo o reformula.",
        suggestion: undefined,
      };
    }

    if (!result.answer) {
      result.answer =
        "No pude generar una respuesta. Asegúrate de tener tareas y miembros configurados.";
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/ai/assistant error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Error en el asistente" },
      { status: 500 }
    );
  }
}
