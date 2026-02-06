import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { updateTaskSchema } from "@/lib/validations/task";

import type { NextRequest } from "next/server";

interface RouteParams {
  params: Promise<{ taskId: string }>;
}

/**
 * GET /api/tasks/[taskId]
 * Get a specific task (must be from same household)
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const member = await requireMember();
    const { taskId } = await params;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        householdId: member.householdId,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("GET /api/tasks/[taskId] error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error fetching task" }, { status: 500 });
  }
}

/**
 * PATCH /api/tasks/[taskId]
 * Update a task (must be from same household)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const member = await requireMember();
    const { taskId } = await params;
    const body: unknown = await request.json();

    const validation = updateTaskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    // Verify task belongs to household
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        householdId: member.householdId,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: validation.data,
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("PATCH /api/tasks/[taskId] error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error updating task" }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[taskId]
 * Soft delete a task (mark as inactive)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const member = await requireMember();
    const { taskId } = await params;

    // Verify task belongs to household
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        householdId: member.householdId,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    // Soft delete
    await prisma.task.update({
      where: { id: taskId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tasks/[taskId] error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error deleting task" }, { status: 500 });
  }
}
