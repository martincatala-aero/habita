import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { CURRENT_HOUSEHOLD_COOKIE } from "@/lib/session";
import { joinHouseholdWithMemberSchema } from "@/lib/validations/household";

import type { NextRequest } from "next/server";
import type { MemberType } from "@prisma/client";

const MEMBER_TYPE_MAP: Record<string, MemberType> = {
  adult: "ADULT",
  teen: "TEEN",
  child: "CHILD",
};

/**
 * POST /api/households/join
 * Unirse a un hogar con código de invitación (opcional: memberName, memberType).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const body: unknown = await request.json();

    const validation = joinHouseholdWithMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const { inviteCode, memberName, memberType } = validation.data;
    const codeNormalized = inviteCode.trim().toUpperCase();

    const household = await prisma.household.findUnique({
      where: { inviteCode: codeNormalized },
    });

    if (!household) {
      return NextResponse.json(
        { error: "Código de invitación inválido" },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const nameToUse = memberName?.trim() || user?.name?.trim() || "Usuario";
    const prismaMemberType: MemberType =
      memberType ? MEMBER_TYPE_MAP[memberType] ?? "ADULT" : "ADULT";

    const member = await prisma.$transaction(async (tx) => {
      const newMember = await tx.member.create({
        data: {
          userId,
          householdId: household.id,
          name: nameToUse,
          memberType: prismaMemberType,
        },
        include: {
          household: true,
        },
      });

      await tx.memberLevel.create({
        data: { memberId: newMember.id },
      });

      return newMember;
    });

    const cookieStore = await cookies();
    cookieStore.set(CURRENT_HOUSEHOLD_COOKIE, household.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json(
      { household: member.household, member: { id: member.id, name: member.name, memberType: member.memberType } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/households/join error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Error al unirse al hogar" },
      { status: 500 }
    );
  }
}
