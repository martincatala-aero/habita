import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

/**
 * GET /api/members
 * Get all members of the current household
 */
export async function GET() {
  try {
    const currentMember = await requireMember();

    const members = await prisma.member.findMany({
      where: {
        householdId: currentMember.householdId,
        isActive: true,
      },
      include: {
        level: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("GET /api/members error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json(
        { error: "No eres miembro de ningún hogar" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Error fetching members" },
      { status: 500 }
    );
  }
}
