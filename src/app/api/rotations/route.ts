import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { createRotationSchema } from "@/lib/validations/rotation";

import type { NextRequest } from "next/server";

/**
 * GET /api/rotations
 * Get all rotations for the household
 */
export async function GET() {
  try {
    const member = await requireMember();

    const rotations = await prisma.taskRotation.findMany({
      where: { householdId: member.householdId },
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
      orderBy: { nextDueDate: "asc" },
    });

    return NextResponse.json({ rotations });
  } catch (error) {
    console.error("GET /api/rotations error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error fetching rotations" }, { status: 500 });
  }
}

/**
 * POST /api/rotations
 * Create a new rotation for a task
 */
export async function POST(request: NextRequest) {
  try {
    const member = await requireMember();
    const body: unknown = await request.json();

    const validation = createRotationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { taskId, frequency, nextDueDate } = validation.data;

    // Verify task belongs to household
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        householdId: member.householdId,
        isActive: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    // Check if rotation already exists
    const existingRotation = await prisma.taskRotation.findUnique({
      where: { taskId },
    });

    if (existingRotation) {
      return NextResponse.json(
        { error: "Ya existe una rotación para esta tarea" },
        { status: 400 }
      );
    }

    // Calculate next due date if not provided
    const calculatedNextDueDate = nextDueDate
      ? new Date(nextDueDate)
      : calculateNextDueDate(frequency);

    const rotation = await prisma.taskRotation.create({
      data: {
        taskId,
        householdId: member.householdId,
        frequency,
        nextDueDate: calculatedNextDueDate,
      },
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

    return NextResponse.json({ rotation }, { status: 201 });
  } catch (error) {
    console.error("POST /api/rotations error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error creating rotation" }, { status: 500 });
  }
}

function calculateNextDueDate(frequency: string): Date {
  const now = new Date();
  now.setHours(12, 0, 0, 0); // Noon today

  switch (frequency) {
    case "DAILY":
      now.setDate(now.getDate() + 1);
      break;
    case "WEEKLY":
      now.setDate(now.getDate() + 7);
      break;
    case "BIWEEKLY":
      now.setDate(now.getDate() + 14);
      break;
    case "MONTHLY":
      now.setMonth(now.getMonth() + 1);
      break;
  }

  return now;
}
