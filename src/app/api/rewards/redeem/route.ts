import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { redeemRewardSchema } from "@/lib/validations/gamification";

import type { NextRequest } from "next/server";

/**
 * POST /api/rewards/redeem
 * Redeem a reward using points
 */
export async function POST(request: NextRequest) {
  try {
    const member = await requireMember();
    const body: unknown = await request.json();

    const validation = redeemRewardSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { rewardId } = validation.data;

    // Get the reward
    const reward = await prisma.householdReward.findFirst({
      where: {
        id: rewardId,
        householdId: member.householdId,
        isActive: true,
      },
    });

    if (!reward) {
      return NextResponse.json({ error: "Recompensa no encontrada" }, { status: 404 });
    }

    // Calculate available points
    const level = await prisma.memberLevel.findUnique({
      where: { memberId: member.id },
    });

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

    if (availablePoints < reward.pointsCost) {
      return NextResponse.json(
        {
          error: `No tienes suficientes puntos. Necesitas ${reward.pointsCost}, tienes ${availablePoints}`,
        },
        { status: 400 }
      );
    }

    // Create redemption
    const redemption = await prisma.rewardRedemption.create({
      data: {
        memberId: member.id,
        rewardId: reward.id,
      },
      include: {
        reward: true,
      },
    });

    return NextResponse.json({
      redemption,
      pointsSpent: reward.pointsCost,
      remainingPoints: availablePoints - reward.pointsCost,
    });
  } catch (error) {
    console.error("POST /api/rewards/redeem error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error redeeming reward" }, { status: 500 });
  }
}
