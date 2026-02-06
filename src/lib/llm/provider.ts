import type {
  LLMProvider as ILLMProvider,
  AssistantOutput,
  SuggestedTasksOutput,
} from "./types";

const DEFAULT_ANSWER =
  "No pude procesar esa pregunta. Asegúrate de tener tareas y miembros en tu hogar.";
const DEFAULT_SUGGESTED_TASKS: SuggestedTasksOutput = { tasks: [] };

/**
 * Proveedor LLM stub: devuelve respuestas por defecto sin llamar a ningún modelo.
 * Usado cuando ANTHROPIC_API_KEY no está configurada.
 */
export const stubLLMProvider: ILLMProvider = {
  async completeWithSchema<T>(options: {
    prompt: string;
    outputSchema: object;
    modelVariant?: "fast" | "standard" | "powerful";
  }): Promise<T> {
    const schema = options.outputSchema as object & { answer?: string; tasks?: unknown[] };
    if ("answer" in schema) {
      return {
        answer: DEFAULT_ANSWER,
        suggestion: undefined,
      } as T as AssistantOutput as T;
    }
    if ("tasks" in schema) {
      return DEFAULT_SUGGESTED_TASKS as T;
    }
    return {} as T;
  },
};

/**
 * Get the LLM provider based on environment configuration.
 * Uses Anthropic Claude if ANTHROPIC_API_KEY is set, otherwise falls back to stub.
 */
export function getLLMProvider(): ILLMProvider {
  // Check if Anthropic API key is configured
  if (process.env.ANTHROPIC_API_KEY) {
    // Dynamic import to avoid loading SDK when not needed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { anthropicProvider } = require("./anthropic-provider") as { anthropicProvider: ILLMProvider };
    return anthropicProvider;
  }

  return stubLLMProvider;
}

/**
 * Check if AI features are enabled (API key is configured).
 */
export function isAIEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
