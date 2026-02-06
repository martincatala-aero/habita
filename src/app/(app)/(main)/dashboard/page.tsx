import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isAIEnabled } from "@/lib/llm/provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityChart } from "@/components/features/activity-chart";
import { StatsCards } from "@/components/features/stats-cards";
import { RecentActivity } from "@/components/features/recent-activity";
import { SuggestionsCard } from "@/components/features/suggestions-card";
import { PlanStatusCard } from "@/components/features/plan-status-card";
import { CopyButton } from "@/components/ui/copy-button";
import { UserPlus } from "lucide-react";

import type { MemberType } from "@prisma/client";

export default async function DashboardPage() {
  const member = await getCurrentMember();

  if (!member) {
    redirect("/onboarding");
  }

  const householdId = member.householdId;
  const now = new Date();

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Get all members
  const members = await prisma.member.findMany({
    where: { householdId, isActive: true },
  });

  // Get totals
  const [totalCompleted, pendingCount, overdueCount] = await Promise.all([
    prisma.assignment.count({
      where: { householdId, status: { in: ["COMPLETED", "VERIFIED"] } },
    }),
    prisma.assignment.count({
      where: { householdId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    }),
    prisma.assignment.count({
      where: {
        householdId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueDate: { lt: now },
      },
    }),
  ]);

  // Get recent activity
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

  // Get daily completions for chart - single query instead of N+1
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const completionsLast7Days = await prisma.assignment.findMany({
    where: {
      householdId,
      status: { in: ["COMPLETED", "VERIFIED"] },
      completedAt: { gte: sevenDaysAgo },
    },
    select: { completedAt: true },
  });

  // Group by date
  const countsByDate = new Map<string, number>();
  for (const a of completionsLast7Days) {
    if (a.completedAt) {
      const dateStr = a.completedAt.toISOString().split("T")[0];
      if (dateStr) {
        countsByDate.set(dateStr, (countsByDate.get(dateStr) ?? 0) + 1);
      }
    }
  }

  // Build array for last 7 days
  const dailyCompletions: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split("T")[0] ?? "";
    dailyCompletions.push({
      date: dateStr,
      count: countsByDate.get(dateStr) ?? 0,
    });
  }

  // Get my pending tasks
  const myPendingTasks = await prisma.assignment.findMany({
    where: {
      memberId: member.id,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: { task: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  // Get active plan for this household
  const activePlan = await prisma.weeklyPlan.findFirst({
    where: {
      householdId,
      status: { in: ["PENDING", "APPLIED"] },
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  const aiEnabled = isAIEnabled();

  return (
    <div className="container max-w-6xl px-4 py-6 sm:py-8">
      {/* Header: hogar + código */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{member.household.name}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          Código: <code className="rounded-xl bg-muted px-2.5 py-1 font-mono text-xs font-semibold">{member.household.inviteCode}</code>
          <CopyButton value={member.household.inviteCode} />
        </p>
      </div>

      {/* Invite banner - when only 1 member */}
      {members.length === 1 && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <UserPlus className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="font-medium">¡Invitá a los miembros de tu hogar!</p>
              <p className="text-sm text-muted-foreground">
                Compartí el código <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold">{member.household.inviteCode}</code> para que se unan y puedan repartir las tareas.
              </p>
            </div>
            <CopyButton value={member.household.inviteCode} />
          </CardContent>
        </Card>
      )}

      {/* Suggestions Card - Priority placement */}
      <div className="mb-6">
        <SuggestionsCard />
      </div>

      {/* Plan Status Card */}
      {aiEnabled && (
        <div className="mb-6">
          <PlanStatusCard
            plan={activePlan ? {
              id: activePlan.id,
              status: activePlan.status,
              balanceScore: activePlan.balanceScore,
              assignments: activePlan.assignments as Array<{
                taskName: string;
                memberName: string;
                memberType: MemberType;
                reason: string;
              }>,
              durationDays: activePlan.durationDays,
              createdAt: activePlan.createdAt,
              appliedAt: activePlan.appliedAt,
              expiresAt: activePlan.expiresAt,
            } : null}
            aiEnabled={aiEnabled}
          />
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 sm:mb-8">
        <StatsCards
          completed={totalCompleted}
          pending={pendingCount}
          overdue={overdueCount}
          members={members.length}
        />
      </div>

      {/* Content grid */}
      <div className="space-y-6">
        <ActivityChart data={dailyCompletions} />

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Mis tareas pendientes</CardTitle>
              <CardDescription>{myPendingTasks.length} tareas</CardDescription>
            </CardHeader>
            <CardContent>
              {myPendingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tienes tareas pendientes</p>
              ) : (
                <ul className="space-y-2">
                  {myPendingTasks.map((task) => (
                    <li key={task.id} className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                      {task.task.name}
                      {task.dueDate && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {new Date(task.dueDate) < now ? (
                            <span className="font-medium text-destructive">Atrasada</span>
                          ) : (
                            new Date(task.dueDate).toLocaleDateString("es", { day: "numeric", month: "short" })
                          )}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <RecentActivity
          activities={recentActivity.map((a) => ({
            id: a.id,
            taskName: a.task.name,
            memberName: a.member.name,
            completedAt: a.completedAt,
          }))}
        />
      </div>
    </div>
  );
}
