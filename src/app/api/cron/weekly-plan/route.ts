import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoAssignAllTasks } from "@/lib/assignment-algorithm";
import { isAIEnabled } from "@/lib/llm/provider";

import type { NextRequest } from "next/server";

interface HouseholdPlanResult {
  householdId: string;
  householdName: string;
  success: boolean;
  assignmentsCreated: number;
  method: "ai" | "algorithm";
  error?: string;
}

/**
 * POST /api/cron/weekly-plan
 * Weekly job: Generate and apply AI-powered task distribution for all households.
 * Run this on Sunday/Monday to plan the week ahead.
 * Protected by CRON_SECRET if defined.
 */
export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active households with at least one member and one task
    const households = await prisma.household.findMany({
      where: {
        members: { some: { isActive: true } },
        tasks: { some: { isActive: true } },
      },
      select: { id: true, name: true },
    });

    const results: HouseholdPlanResult[] = [];
    const aiEnabled = isAIEnabled();

    for (const household of households) {
      try {
        const result = await autoAssignAllTasks(household.id, { useAI: aiEnabled });

        results.push({
          householdId: household.id,
          householdName: household.name,
          success: result.success,
          assignmentsCreated: result.assignmentsCreated,
          method: result.method,
        });
      } catch (error) {
        console.error(`Weekly plan failed for household ${household.name}:`, error);
        results.push({
          householdId: household.id,
          householdName: household.name,
          success: false,
          assignmentsCreated: 0,
          method: "algorithm",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const totalAssignments = results.reduce((sum, r) => sum + r.assignmentsCreated, 0);
    const successCount = results.filter((r) => r.success).length;
    const aiCount = results.filter((r) => r.method === "ai").length;

    return NextResponse.json({
      success: true,
      summary: {
        householdsProcessed: households.length,
        householdsSuccessful: successCount,
        totalAssignmentsCreated: totalAssignments,
        usedAI: aiCount,
        usedAlgorithm: results.length - aiCount,
      },
      aiEnabled,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/cron/weekly-plan error:", error);
    return NextResponse.json(
      { error: "Error processing weekly plan" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/weekly-plan
 * Status endpoint for monitoring.
 */
export async function GET() {
  const aiEnabled = isAIEnabled();

  return NextResponse.json({
    status: "ready",
    endpoint: "POST /api/cron/weekly-plan",
    description: "Generates and applies AI-powered task distribution for all households",
    aiEnabled,
    recommendation: "Run weekly on Sunday or Monday morning",
  });
}
