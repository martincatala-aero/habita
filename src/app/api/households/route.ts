import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentMember } from "@/lib/session";
import { createHouseholdSchema } from "@/lib/validations/household";

import type { NextRequest } from "next/server";

/**
 * GET /api/households
 * Get the current user's household (if member of one)
 */
export async function GET() {
  try {
    const member = await getCurrentMember();

    if (!member) {
      return NextResponse.json({ household: null });
    }

    return NextResponse.json({ household: member.household });
  } catch (error) {
    console.error("GET /api/households error:", error);
    return NextResponse.json(
      { error: "Error fetching household" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/households
 * Create a new household and add the current user as the first member
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const body: unknown = await request.json();

    const validation = createHouseholdSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name } = validation.data;

    // Check if user already has a household
    const existingMember = await getCurrentMember();
    if (existingMember) {
      return NextResponse.json(
        { error: "Ya eres miembro de un hogar" },
        { status: 400 }
      );
    }

    // Get user info for member name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Create household and member in a transaction
    const household = await prisma.$transaction(async (tx) => {
      const newHousehold = await tx.household.create({
        data: { name },
      });

      await tx.member.create({
        data: {
          userId,
          householdId: newHousehold.id,
          name: user?.name ?? "Usuario",
          memberType: "ADULT",
        },
      });

      // Create initial MemberLevel
      const member = await tx.member.findFirst({
        where: { userId, householdId: newHousehold.id },
      });

      if (member) {
        await tx.memberLevel.create({
          data: { memberId: member.id },
        });
      }

      return newHousehold;
    });

    return NextResponse.json({ household }, { status: 201 });
  } catch (error) {
    console.error("POST /api/households error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Error creating household" },
      { status: 500 }
    );
  }
}
