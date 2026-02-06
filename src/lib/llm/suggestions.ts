import { getLLMProvider } from "./provider";

import type { MemberType } from "@prisma/client";

interface SuggestionItem {
  type: "hero" | "chip" | "tip" | "action";
  title: string;
  description?: string;
  priority?: "high" | "medium" | "low";
  icon?: string;
  actionLabel?: string;
  actionHref?: string;
}

interface SuggestionsResponse {
  headline: string;
  subheadline?: string;
  items: SuggestionItem[];
  contextSummary: string;
}

interface SuggestionContext {
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  hour: number;
  dayOfWeek: number;
  isWeekend: boolean;
  isEndOfMonth: boolean;
  isStartOfMonth: boolean;
  currentMember: string;
  memberCount: number;
  members: Array<{ name: string; type: MemberType }>;
  taskCount: number;
  pendingCount: number;
  overdueCount: number;
  hasPlan: boolean;
  planStatus: string | null;
  recentCompletions: number;
  myPendingTasks: Array<{ name: string; dueDate: Date | null; isOverdue: boolean }>;
  overdueTaskNames: string[];
}

const TIME_GREETINGS: Record<string, string> = {
  morning: "Buenos días",
  afternoon: "Buenas tardes",
  evening: "Buenas noches",
  night: "Buenas noches",
};

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/**
 * Generate contextual suggestions based on household state and time context.
 */
export async function generateContextualSuggestions(
  context: SuggestionContext
): Promise<SuggestionsResponse> {
  const provider = getLLMProvider();

  const prompt = buildSuggestionsPrompt(context);

  try {
    const result = await provider.completeWithSchema<SuggestionsResponse>({
      prompt,
      outputSchema: {
        headline: "string",
        subheadline: "string (optional)",
        items: "array of suggestion items",
        contextSummary: "string",
      },
      modelVariant: "fast",
    });

    return result;
  } catch (error) {
    console.error("Error generating suggestions:", error);
    // Return fallback suggestions
    return generateFallbackSuggestions(context);
  }
}

function buildSuggestionsPrompt(context: SuggestionContext): string {
  const dayName = DAY_NAMES[context.dayOfWeek] ?? "hoy";
  const greeting = TIME_GREETINGS[context.timeOfDay];

  return `Eres un asistente del hogar que genera sugerencias personalizadas y contextuales.

## Contexto actual
- Saludo: "${greeting}, ${context.currentMember}"
- Momento: ${context.timeOfDay} (${context.hour}:00), ${dayName}
- Fin de semana: ${context.isWeekend ? "sí" : "no"}
- Inicio de mes: ${context.isStartOfMonth ? "sí" : "no"}
- Fin de mes: ${context.isEndOfMonth ? "sí" : "no"}

## Estado del hogar
- Miembros: ${context.memberCount} (${context.members.map((m) => `${m.name} [${m.type}]`).join(", ")})
- Tareas definidas: ${context.taskCount}
- Tareas pendientes del hogar: ${context.pendingCount}
- Tareas vencidas: ${context.overdueCount}${context.overdueTaskNames.length > 0 ? ` (${context.overdueTaskNames.join(", ")})` : ""}
- Tiene plan activo: ${context.hasPlan ? `sí (${context.planStatus})` : "no"}
- Completadas esta semana: ${context.recentCompletions}

## Tareas pendientes de ${context.currentMember}
${context.myPendingTasks.length > 0 ? context.myPendingTasks.map((t) => `- ${t.name}${t.isOverdue ? " (VENCIDA)" : ""}`).join("\n") : "(ninguna)"}

## Instrucciones
Genera sugerencias útiles y contextuales. Responde SOLO con JSON válido:

{
  "headline": "Mensaje principal corto y motivador (max 50 chars)",
  "subheadline": "Detalle opcional breve",
  "items": [
    {
      "type": "hero|chip|tip|action",
      "title": "Título corto",
      "description": "Descripción opcional",
      "priority": "high|medium|low",
      "icon": "nombre de icono lucide (clock, alert-triangle, check-circle, etc)",
      "actionLabel": "Texto del botón (si type=action)",
      "actionHref": "URL relativa (si type=action)"
    }
  ],
  "contextSummary": "Resumen de una línea del contexto considerado"
}

Reglas:
- "hero": mensaje principal destacado (max 1)
- "chip": etiquetas rápidas de estado (max 3)
- "tip": consejos contextuales (max 2)
- "action": acciones sugeridas con botón (max 2)
- Si hay tareas vencidas, priorizar eso
- Si no hay plan y hay muchas tareas, sugerir generar plan
- Considerar el momento del día para tono y urgencia
- Ser motivador pero no condescendiente
- Total de items: 3-6

URLs VÁLIDAS para actionHref (SOLO usar estas):
- "/my-tasks" - Ver mis tareas asignadas
- "/plan" - Generar o ver plan de distribución
- "/tasks" - Gestionar tareas del hogar
- "/members" - Ver miembros del hogar
- "/dashboard" - Volver al inicio
NO inventes otras URLs. Si no aplica ninguna, no incluyas action.`;
}

function generateFallbackSuggestions(context: SuggestionContext): SuggestionsResponse {
  const greeting = TIME_GREETINGS[context.timeOfDay];
  const items: SuggestionItem[] = [];

  // Build contextual headline
  let headline = `${greeting}, ${context.currentMember}`;
  let subheadline: string | undefined;

  // Priority: overdue tasks
  if (context.overdueCount > 0) {
    items.push({
      type: "hero",
      title: `${context.overdueCount} tarea${context.overdueCount > 1 ? "s" : ""} vencida${context.overdueCount > 1 ? "s" : ""}`,
      description: "Hay tareas que necesitan atención",
      priority: "high",
      icon: "alert-triangle",
    });
    subheadline = "Tienes tareas que requieren atención";
  }

  // No plan suggestion
  if (!context.hasPlan && context.taskCount > 0) {
    items.push({
      type: "action",
      title: "Distribuir tareas",
      description: "Genera un plan equitativo para la semana",
      actionLabel: "Generar plan",
      actionHref: "/plan",
      icon: "calendar-days",
    });
  }

  // My pending tasks chip
  if (context.myPendingTasks.length > 0) {
    items.push({
      type: "chip",
      title: `${context.myPendingTasks.length} pendiente${context.myPendingTasks.length > 1 ? "s" : ""}`,
      icon: "list-todo",
    });
  }

  // Recent completions chip
  if (context.recentCompletions > 0) {
    items.push({
      type: "chip",
      title: `${context.recentCompletions} completadas`,
      description: "esta semana",
      icon: "check-circle",
    });
  }

  // Weekend tip
  if (context.isWeekend && context.pendingCount > 3) {
    items.push({
      type: "tip",
      title: "Buen momento para ponerse al día",
      description: "El fin de semana es ideal para adelantar tareas",
      icon: "lightbulb",
    });
  }

  // Default headline if no overdue
  if (!subheadline) {
    if (context.myPendingTasks.length === 0) {
      subheadline = "¡Estás al día con tus tareas!";
    } else {
      subheadline = `Tienes ${context.myPendingTasks.length} tarea${context.myPendingTasks.length > 1 ? "s" : ""} pendiente${context.myPendingTasks.length > 1 ? "s" : ""}`;
    }
  }

  return {
    headline,
    subheadline,
    items: items.slice(0, 6),
    contextSummary: `${context.timeOfDay}, ${context.pendingCount} pendientes, ${context.overdueCount} vencidas`,
  };
}
