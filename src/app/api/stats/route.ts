import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

/**
 * GET /api/stats
 * Get household statistics
 */
export async function GET() {
  try {
    const member = await requireMember();
    const householdId = member.householdId;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all members with their levels
    const members = await prisma.member.findMany({
      where: { householdId, isActive: true },
      include: {
        level: true,
      },
    });

    // Get assignments completed this week per member
    const weeklyCompletions = await prisma.assignment.groupBy({
      by: ["memberId"],
      where: {
        householdId,
        status: { in: ["COMPLETED", "VERIFIED"] },
        completedAt: { gte: startOfWeek },
      },
      _count: { id: true },
    });

    const weeklyCompletionMap = new Map(
      weeklyCompletions.map((c) => [c.memberId, c._count.id])
    );

    // Get assignments completed this month per member
    const monthlyCompletions = await prisma.assignment.groupBy({
      by: ["memberId"],
      where: {
        householdId,
        status: { in: ["COMPLETED", "VERIFIED"] },
        completedAt: { gte: startOfMonth },
      },
      _count: { id: true },
    });

    const monthlyCompletionMap = new Map(
      monthlyCompletions.map((c) => [c.memberId, c._count.id])
    );

    // Get total completions per member (all time)
    const totalCompletions = await prisma.assignment.groupBy({
      by: ["memberId"],
      where: {
        householdId,
        status: { in: ["COMPLETED", "VERIFIED"] },
      },
      _count: { id: true },
    });

    const totalCompletionMap = new Map(
      totalCompletions.map((c) => [c.memberId, c._count.id])
    );

    // Build leaderboard
    const leaderboard = members
      .map((m) => ({
        id: m.id,
        name: m.name,
        memberType: m.memberType,
        level: m.level?.level ?? 1,
        xp: m.level?.xp ?? 0,
        weeklyTasks: weeklyCompletionMap.get(m.id) ?? 0,
        monthlyTasks: monthlyCompletionMap.get(m.id) ?? 0,
        totalTasks: totalCompletionMap.get(m.id) ?? 0,
      }))
      .sort((a, b) => b.xp - a.xp);

    // Household totals
    const totalTasksCompleted = await prisma.assignment.count({
      where: {
        householdId,
        status: { in: ["COMPLETED", "VERIFIED"] },
      },
    });

    const pendingTasks = await prisma.assignment.count({
      where: {
        householdId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });

    const overdueTasks = await prisma.assignment.count({
      where: {
        householdId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueDate: { lt: now },
      },
    });

    // Recent activity (last 7 days)
    const recentActivity = await prisma.assignment.findMany({
      where: {
        householdId,
        status: { in: ["COMPLETED", "VERIFIED"] },
        completedAt: { gte: startOfWeek },
      },
      include: {
        task: { select: { name: true } },
        member: { select: { name: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 10,
    });

    // Daily completions for the week (for chart)
    const dailyCompletions: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const count = await prisma.assignment.count({
        where: {
          householdId,
          status: { in: ["COMPLETED", "VERIFIED"] },
          completedAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      dailyCompletions.push({
        date: date.toISOString().split("T")[0] ?? "",
        count,
      });
    }

    return NextResponse.json({
      leaderboard,
      totals: {
        completed: totalTasksCompleted,
        pending: pendingTasks,
        overdue: overdueTasks,
        members: members.length,
      },
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        taskName: a.task.name,
        memberName: a.member.name,
        completedAt: a.completedAt,
      })),
      dailyCompletions,
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error fetching stats" }, { status: 500 });
  }
}
