import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { createAssignmentSchema } from "@/lib/validations/assignment";

import type { NextRequest } from "next/server";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * GET /api/assignments
 * Get assignments for the current household
 * Query params: status, memberId, from, to, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const member = await requireMember();
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get("status");
    const memberId = searchParams.get("memberId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10),
      MAX_LIMIT
    );
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const whereClause = {
      householdId: member.householdId,
      ...(status && { status: status as never }),
      ...(memberId && { memberId }),
      ...(from && { dueDate: { gte: new Date(from) } }),
      ...(to && { dueDate: { lte: new Date(to) } }),
    };

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where: whereClause,
        include: {
          task: {
            select: {
              id: true,
              name: true,
              weight: true,
              frequency: true,
              estimatedMinutes: true,
            },
          },
          member: {
            select: {
              id: true,
              name: true,
              memberType: true,
            },
          },
        },
        orderBy: { dueDate: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.assignment.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      assignments,
      pagination: { total, limit, offset, hasMore: offset + assignments.length < total },
    });
  } catch (error) {
    console.error("GET /api/assignments error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error fetching assignments" }, { status: 500 });
  }
}

/**
 * POST /api/assignments
 * Create a new assignment (manual assignment)
 */
export async function POST(request: NextRequest) {
  try {
    const member = await requireMember();
    const body: unknown = await request.json();

    const validation = createAssignmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { taskId, memberId, dueDate, notes } = validation.data;

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

    // Verify member belongs to household
    const targetMember = await prisma.member.findFirst({
      where: {
        id: memberId,
        householdId: member.householdId,
        isActive: true,
      },
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        taskId,
        memberId,
        householdId: member.householdId,
        dueDate,
        notes,
      },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            weight: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/assignments error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error creating assignment" }, { status: 500 });
  }
}
