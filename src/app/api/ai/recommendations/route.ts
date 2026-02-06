import { NextResponse } from "next/server";
import { requireMember } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isAIEnabled } from "@/lib/llm/provider";
import { generateWeeklyPlan } from "@/lib/llm/anthropic-provider";

/**
 * GET /api/ai/recommendations
 * Get AI-powered task assignment recommendations for the household.
 */
export async function GET() {
  try {
    const member = await requireMember();

    if (!isAIEnabled()) {
      return NextResponse.json(
        { error: "AI features not configured" },
        { status: 503 }
      );
    }

    // Get household data
    const [members, tasks, recentAssignments] = await Promise.all([
      prisma.member.findMany({
        where: { householdId: member.householdId, isActive: true },
        include: {
          assignments: {
            where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
            select: { id: true },
          },
        },
      }),
      prisma.task.findMany({
        where: { householdId: member.householdId, isActive: true },
        select: { name: true, frequency: true, weight: true },
      }),
      prisma.assignment.findMany({
        where: { householdId: member.householdId },
        take: 20,
        orderBy: { updatedAt: "desc" },
        include: {
          task: { select: { name: true } },
          member: { select: { name: true } },
        },
      }),
    ]);

    const recommendations = await generateWeeklyPlan({
      members: members.map((m) => ({
        name: m.name,
        type: m.memberType,
        pendingTasks: m.assignments.length,
      })),
      tasks: tasks.map((t) => ({
        name: t.name,
        frequency: t.frequency,
        weight: t.weight,
      })),
      recentAssignments: recentAssignments.map((a) => ({
        taskName: a.task.name,
        memberName: a.member.name,
        completedAt: a.completedAt ?? undefined,
      })),
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("GET /api/ai/recommendations error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Error getting recommendations" },
      { status: 500 }
    );
  }
}
