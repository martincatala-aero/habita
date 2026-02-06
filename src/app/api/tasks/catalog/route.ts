import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { getCategoryMeta } from "@/lib/catalog-meta";

const FREQUENCY_TO_LOWER: Record<string, string> = {
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
  ONCE: "once",
};

/**
 * GET /api/tasks/catalog
 * Catálogo de tareas predefinidas (para onboarding y gestión).
 * Requiere auth; no requiere ser miembro de un hogar.
 */
export async function GET() {
  try {
    await requireAuth();

    const catalog = await prisma.taskCatalog.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const categoryMap = new Map<
      string,
      { category: string; label: string; icon: string; tasks: Array<{
        name: string;
        icon: string;
        defaultFrequency: string;
        defaultWeight: number;
        estimatedMinutes: number | null;
        minAge: number | null;
      }> }
    >();

    for (const task of catalog) {
      const meta = getCategoryMeta(task.category);
      if (!categoryMap.has(task.category)) {
        categoryMap.set(task.category, {
          category: task.category,
          label: meta.label,
          icon: meta.icon,
          tasks: [],
        });
      }
      const entry = categoryMap.get(task.category)!;
      entry.tasks.push({
        name: task.name,
        icon: meta.icon,
        defaultFrequency: FREQUENCY_TO_LOWER[task.defaultFrequency] ?? "weekly",
        defaultWeight: task.defaultWeight,
        estimatedMinutes: task.estimatedMinutes,
        minAge: task.suggestedMinAge ?? null,
      });
    }

    const categories = Array.from(categoryMap.values());

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET /api/tasks/catalog error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Error fetching catalog" },
      { status: 500 }
    );
  }
}
