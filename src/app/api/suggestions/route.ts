import { NextResponse } from "next/server";
import { requireMember } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isAIEnabled } from "@/lib/llm/provider";
import { generateContextualSuggestions } from "@/lib/llm/suggestions";

export interface SuggestionItem {
  type: "hero" | "chip" | "tip" | "action";
  title: string;
  description?: string;
  priority?: "high" | "medium" | "low";
  icon?: string;
  actionLabel?: string;
  actionHref?: string;
}

export interface SuggestionsResponse {
  headline: string;
  subheadline?: string;
  items: SuggestionItem[];
  contextSummary: string;
}

// In-memory cache for suggestions
interface CacheEntry {
  data: SuggestionsResponse;
  expiresAt: number;
}

const suggestionsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(memberId: string, hour: number): string {
  // Cache key includes member and hour (so suggestions update each hour)
  return `${memberId}:${hour}`;
}

function getFromCache(key: string): SuggestionsResponse | null {
  const entry = suggestionsCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    suggestionsCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: SuggestionsResponse): void {
  suggestionsCache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * GET /api/suggestions
 * Get contextual suggestions based on time, day, weather, and household state.
 * Cached for 5 minutes per member/hour.
 */
export async function GET() {
  try {
    const member = await requireMember();

    if (!isAIEnabled()) {
      return NextResponse.json(
        { error: "Suggestions service not configured" },
        { status: 503 }
      );
    }

    const now = new Date();
    const hour = now.getHours();

    // Check cache first
    const cacheKey = getCacheKey(member.id, hour);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const dayOfWeek = now.getDay(); // 0 = Sunday
    const dayOfMonth = now.getDate();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isEndOfMonth = dayOfMonth >= 25;
    const isStartOfMonth = dayOfMonth <= 5;

    // Get time of day context
    let timeOfDay: "morning" | "afternoon" | "evening" | "night";
    if (hour >= 5 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 18) timeOfDay = "afternoon";
    else if (hour >= 18 && hour < 22) timeOfDay = "evening";
    else timeOfDay = "night";

    // Get household context
    const [members, tasks, pendingAssignments, activePlan, recentCompletions] = await Promise.all([
      prisma.member.findMany({
        where: { householdId: member.householdId, isActive: true },
        select: { id: true, name: true, memberType: true },
      }),
      prisma.task.findMany({
        where: { householdId: member.householdId, isActive: true },
        select: { id: true, name: true, frequency: true, weight: true },
      }),
      prisma.assignment.findMany({
        where: {
          householdId: member.householdId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
        include: {
          task: { select: { name: true, frequency: true } },
          member: { select: { name: true } },
        },
        orderBy: { dueDate: "asc" },
      }),
      prisma.weeklyPlan.findFirst({
        where: {
          householdId: member.householdId,
          status: { in: ["PENDING", "APPLIED"] },
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.assignment.count({
        where: {
          householdId: member.householdId,
          status: { in: ["COMPLETED", "VERIFIED"] },
          completedAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Calculate overdue tasks
    const overdueAssignments = pendingAssignments.filter(
      (a) => a.dueDate && new Date(a.dueDate) < now
    );

    // Build context for LLM
    const context = {
      timeOfDay,
      hour,
      dayOfWeek,
      isWeekend,
      isEndOfMonth,
      isStartOfMonth,
      currentMember: member.name,
      memberCount: members.length,
      members: members.map((m) => ({ name: m.name, type: m.memberType })),
      taskCount: tasks.length,
      pendingCount: pendingAssignments.length,
      overdueCount: overdueAssignments.length,
      hasPlan: !!activePlan,
      planStatus: activePlan?.status ?? null,
      recentCompletions,
      myPendingTasks: pendingAssignments
        .filter((a) => a.memberId === member.id)
        .map((a) => ({
          name: a.task.name,
          dueDate: a.dueDate,
          isOverdue: a.dueDate ? new Date(a.dueDate) < now : false,
        })),
      overdueTaskNames: overdueAssignments.slice(0, 5).map((a) => a.task.name),
    };

    // Generate suggestions using LLM
    const suggestions = await generateContextualSuggestions(context);

    // Cache the result
    setCache(cacheKey, suggestions);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("GET /api/suggestions error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Error getting suggestions" },
      { status: 500 }
    );
  }
}
