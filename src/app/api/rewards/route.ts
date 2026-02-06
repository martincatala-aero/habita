import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { createRewardSchema } from "@/lib/validations/gamification";

import type { NextRequest } from "next/server";

/**
 * GET /api/rewards
 * Get all rewards for the current household
 */
export async function GET() {
  try {
    const member = await requireMember();

    const rewards = await prisma.householdReward.findMany({
      where: {
        householdId: member.householdId,
        isActive: true,
      },
      orderBy: { pointsCost: "asc" },
    });

    // Get member's total points (XP)
    const level = await prisma.memberLevel.findUnique({
      where: { memberId: member.id },
    });

    // Get member's spent points
    const redemptions = await prisma.rewardRedemption.findMany({
      where: { memberId: member.id },
      include: {
        reward: {
          select: { pointsCost: true },
        },
      },
    });

    const spentPoints = redemptions.reduce((sum, r) => sum + r.reward.pointsCost, 0);
    const availablePoints = (level?.xp ?? 0) - spentPoints;

    return NextResponse.json({
      rewards,
      stats: {
        totalXp: level?.xp ?? 0,
        spentPoints,
        availablePoints,
      },
    });
  } catch (error) {
    console.error("GET /api/rewards error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error fetching rewards" }, { status: 500 });
  }
}

/**
 * POST /api/rewards
 * Create a new reward for the household
 */
export async function POST(request: NextRequest) {
  try {
    const member = await requireMember();
    const body: unknown = await request.json();

    const validation = createRewardSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const reward = await prisma.householdReward.create({
      data: {
        ...validation.data,
        householdId: member.householdId,
      },
    });

    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    console.error("POST /api/rewards error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error creating reward" }, { status: 500 });
  }
}
