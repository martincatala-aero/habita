import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { updateRotationSchema } from "@/lib/validations/rotation";

import type { NextRequest } from "next/server";

interface RouteParams {
  params: Promise<{ rotationId: string }>;
}

/**
 * GET /api/rotations/[rotationId]
 * Get a specific rotation
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const member = await requireMember();
    const { rotationId } = await params;

    const rotation = await prisma.taskRotation.findFirst({
      where: {
        id: rotationId,
        householdId: member.householdId,
      },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            frequency: true,
            weight: true,
            description: true,
          },
        },
      },
    });

    if (!rotation) {
      return NextResponse.json({ error: "Rotación no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ rotation });
  } catch (error) {
    console.error("GET /api/rotations/[rotationId] error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error fetching rotation" }, { status: 500 });
  }
}

/**
 * PATCH /api/rotations/[rotationId]
 * Update a rotation
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const member = await requireMember();
    const { rotationId } = await params;
    const body: unknown = await request.json();

    const validation = updateRotationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    // Verify rotation belongs to household
    const existingRotation = await prisma.taskRotation.findFirst({
      where: {
        id: rotationId,
        householdId: member.householdId,
      },
    });

    if (!existingRotation) {
      return NextResponse.json({ error: "Rotación no encontrada" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (validation.data.frequency !== undefined) {
      updateData.frequency = validation.data.frequency;
    }
    if (validation.data.isActive !== undefined) {
      updateData.isActive = validation.data.isActive;
    }
    if (validation.data.nextDueDate !== undefined) {
      updateData.nextDueDate = new Date(validation.data.nextDueDate);
    }

    const rotation = await prisma.taskRotation.update({
      where: { id: rotationId },
      data: updateData,
      include: {
        task: {
          select: {
            id: true,
            name: true,
            frequency: true,
            weight: true,
          },
        },
      },
    });

    return NextResponse.json({ rotation });
  } catch (error) {
    console.error("PATCH /api/rotations/[rotationId] error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error updating rotation" }, { status: 500 });
  }
}

/**
 * DELETE /api/rotations/[rotationId]
 * Delete a rotation
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const member = await requireMember();
    const { rotationId } = await params;

    // Verify rotation belongs to household
    const existingRotation = await prisma.taskRotation.findFirst({
      where: {
        id: rotationId,
        householdId: member.householdId,
      },
    });

    if (!existingRotation) {
      return NextResponse.json({ error: "Rotación no encontrada" }, { status: 404 });
    }

    await prisma.taskRotation.delete({
      where: { id: rotationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/rotations/[rotationId] error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error deleting rotation" }, { status: 500 });
  }
}
