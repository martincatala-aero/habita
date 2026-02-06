import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { PENALTY_DESCRIPTIONS } from "@/lib/validations/penalty";

import type { NextRequest } from "next/server";
import type { PenaltyReason } from "@/lib/validations/penalty";

/**
 * GET /api/penalties
 * Get penalties for the current member or all household members (for adults)
 */
export async function GET(request: NextRequest) {
  try {
    const member = await requireMember();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    // If scope=household and user is adult, get all penalties
    if (scope === "household" && member.memberType === "ADULT") {
      const penalties = await prisma.penalty.findMany({
        where: {
          member: {
            householdId: member.householdId,
          },
        },
        include: {
          member: {
            select: { id: true, name: true, avatarUrl: true },
          },
          assignment: {
            select: {
              id: true,
              task: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const enrichedPenalties = penalties.map((p) => ({
        ...p,
        reasonDescription: PENALTY_DESCRIPTIONS[p.reason as PenaltyReason],
      }));

      return NextResponse.json({ penalties: enrichedPenalties });
    }

    // Otherwise, get only current member's penalties
    const penalties = await prisma.penalty.findMany({
      where: {
        memberId: member.id,
      },
      include: {
        assignment: {
          select: {
            id: true,
            task: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const enrichedPenalties = penalties.map((p) => ({
      ...p,
      reasonDescription: PENALTY_DESCRIPTIONS[p.reason as PenaltyReason],
    }));

    // Calculate total penalty points
    const totalPenaltyPoints = penalties.reduce((sum, p) => sum + p.points, 0);

    return NextResponse.json({
      penalties: enrichedPenalties,
      stats: {
        totalPenalties: penalties.length,
        totalPenaltyPoints,
      },
    });
  } catch (error) {
    console.error("GET /api/penalties error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error fetching penalties" }, { status: 500 });
  }
}
