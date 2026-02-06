import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { requireMember } from "@/lib/session";
import { buildAssistantContext } from "@/lib/llm/assistant-context";
import { ASSISTANT_SYSTEM } from "@/lib/llm/prompts";
import { isAIEnabled } from "@/lib/llm/provider";

import type { NextRequest } from "next/server";

/**
 * POST /api/ai/chat
 * Streaming chat endpoint for the AI assistant.
 * Returns a text stream for real-time UI updates.
 */
export async function POST(request: NextRequest) {
  try {
    const member = await requireMember();

    if (!isAIEnabled()) {
      return new Response(
        JSON.stringify({ error: "AI features not configured. Set ANTHROPIC_API_KEY." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: unknown = await request.json();
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: unknown }).message)
        : "";

    if (!message.trim()) {
      return new Response(
        JSON.stringify({ error: "message es requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build context from household data
    const context = await buildAssistantContext(member.householdId, member.name);

    const contextText = `
## Usuario actual
${context.currentUser}

## Miembros del hogar
${context.members}

## Tareas del hogar
${context.tasks}

## Actividad reciente
${context.recentActivity}

## Estadísticas por miembro (esta semana)
${context.memberStats}
`.trim();

    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const result = streamText({
      model: anthropic("claude-3-5-haiku-latest"),
      system: ASSISTANT_SYSTEM,
      prompt: `${contextText}\n\n## Pregunta del usuario\n${message}`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("POST /api/ai/chat error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Error en el chat" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
