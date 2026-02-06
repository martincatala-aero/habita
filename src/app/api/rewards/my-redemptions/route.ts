import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

/**
 * GET /api/rewards/my-redemptions
 * Get the current member's reward redemptions
 */
export async function GET() {
  try {
    const member = await requireMember();

    const redemptions = await prisma.rewardRedemption.findMany({
      where: { memberId: member.id },
      include: {
        reward: true,
      },
      orderBy: { redeemedAt: "desc" },
    });

    const pending = redemptions.filter((r) => !r.isFulfilled);
    const fulfilled = redemptions.filter((r) => r.isFulfilled);

    return NextResponse.json({
      redemptions,
      pending,
      fulfilled,
      stats: {
        total: redemptions.length,
        pendingCount: pending.length,
        fulfilledCount: fulfilled.length,
      },
    });
  } catch (error) {
    console.error("GET /api/rewards/my-redemptions error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error fetching redemptions" }, { status: 500 });
  }
}
