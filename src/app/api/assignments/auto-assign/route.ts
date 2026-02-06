import { NextResponse } from "next/server";
import { requireMember } from "@/lib/session";
import { autoAssignSchema } from "@/lib/validations/assignment";
import { autoAssignTask, calculateAssignmentScores } from "@/lib/assignment-algorithm";

import type { NextRequest } from "next/server";

/**
 * POST /api/assignments/auto-assign
 * Auto-assign a task to the best available member
 */
export async function POST(request: NextRequest) {
  try {
    const member = await requireMember();
    const body: unknown = await request.json();

    const validation = autoAssignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { taskId, dueDate } = validation.data;

    const result = await autoAssignTask(member.householdId, taskId, dueDate);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/assignments/auto-assign error:", error);

    if (error instanceof Error) {
      if (error.message === "Not a member of any household") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "Task not found") {
        return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
      }
      if (error.message === "No eligible members for this task") {
        return NextResponse.json(
          { error: "No hay miembros elegibles para esta tarea" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "Error auto-assigning task" }, { status: 500 });
  }
}

/**
 * GET /api/assignments/auto-assign?taskId=xxx
 * Preview auto-assignment scores without creating an assignment
 */
export async function GET(request: NextRequest) {
  try {
    const member = await requireMember();
    const taskId = request.nextUrl.searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "taskId es requerido" }, { status: 400 });
    }

    const scores = await calculateAssignmentScores(member.householdId, taskId);

    return NextResponse.json({ scores });
  } catch (error) {
    console.error("GET /api/assignments/auto-assign error:", error);

    if (error instanceof Error) {
      if (error.message === "Not a member of any household") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "Task not found") {
        return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Error calculating scores" }, { status: 500 });
  }
}
