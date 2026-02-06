import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { completeAssignmentSchema } from "@/lib/validations/assignment";
import { calculatePoints } from "@/lib/points";
import { checkAndUnlockAchievements, calculateStreak } from "@/lib/achievements";
import { getBestAssignee } from "@/lib/assignment-algorithm";
import { computeDueDateForFrequency } from "@/lib/due-date";

import type { NextRequest } from "next/server";

interface RouteParams {
  params: Promise<{ assignmentId: string }>;
}

/**
 * POST /api/assignments/[assignmentId]/complete
 * Mark an assignment as completed and award points
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const member = await requireMember();
    const { assignmentId } = await params;
    const body: unknown = await request.json();

    const validation = completeAssignmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    // Get assignment with task details
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        householdId: member.householdId,
      },
      include: {
        task: true,
        member: {
          include: {
            level: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Asignación no encontrada" }, { status: 404 });
    }

    if (assignment.status === "COMPLETED" || assignment.status === "VERIFIED") {
      return NextResponse.json({ error: "La tarea ya fue completada" }, { status: 400 });
    }

    if (assignment.status === "CANCELLED") {
      return NextResponse.json({ error: "La tarea fue cancelada" }, { status: 400 });
    }

    // Calculate points
    const now = new Date();
    const isOnTime = now <= assignment.dueDate;
    const streakDays = await calculateStreak(assignment.memberId);
    const points = calculatePoints({
      weight: assignment.task.weight,
      frequency: assignment.task.frequency,
      isOnTime,
      streakDays,
    });

    // Update assignment and member level in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update assignment
      const updatedAssignment = await tx.assignment.update({
        where: { id: assignmentId },
        data: {
          status: "COMPLETED",
          completedAt: now,
          pointsEarned: points,
          notes: validation.data.notes ?? assignment.notes,
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

      // Update or create member level
      const currentLevel = assignment.member.level;
      const newXp = (currentLevel?.xp ?? 0) + points;
      const newLevel = Math.floor(newXp / 100) + 1;

      if (currentLevel) {
        await tx.memberLevel.update({
          where: { id: currentLevel.id },
          data: {
            xp: newXp,
            level: newLevel,
          },
        });
      } else {
        await tx.memberLevel.create({
          data: {
            memberId: assignment.memberId,
            xp: newXp,
            level: newLevel,
          },
        });
      }

      return {
        assignment: updatedAssignment,
        pointsEarned: points,
        newXp,
        newLevel,
        leveledUp: currentLevel ? newLevel > currentLevel.level : newLevel > 1,
      };
    });

    // Check for new achievements (after transaction)
    const newAchievements = await checkAndUnlockAchievements(
      assignment.memberId,
      { ...assignment, completedAt: now }
    );

    // Update competition score if there's an active competition
    let competitionScoreUpdated = true;
    try {
      const activeCompetition = await prisma.competition.findFirst({
        where: {
          householdId: member.householdId,
          status: "ACTIVE",
        },
      });

      if (activeCompetition) {
        await prisma.competitionScore.upsert({
          where: {
            competitionId_memberId: {
              competitionId: activeCompetition.id,
              memberId: assignment.memberId,
            },
          },
          update: {
            points: { increment: points },
            tasksCompleted: { increment: 1 },
          },
          create: {
            competitionId: activeCompetition.id,
            memberId: assignment.memberId,
            points,
            tasksCompleted: 1,
          },
        });
      }
    } catch (err) {
      competitionScoreUpdated = false;
      console.error("Error updating competition score:", err);
    }

    // Spec §2.1: al completar, crear siguiente instancia y asignar
    let nextAssignment = null;
    let nextAssignmentError = false;
    if (assignment.task.frequency !== "ONCE") {
      try {
        const nextDue = computeDueDateForFrequency(
          assignment.task.frequency,
          now
        );
        const best = await getBestAssignee(
          assignment.householdId,
          assignment.taskId,
          nextDue
        );
        if (best) {
          nextAssignment = await prisma.assignment.create({
            data: {
              taskId: assignment.taskId,
              memberId: best.memberId,
              householdId: assignment.householdId,
              dueDate: nextDue,
              status: "PENDING",
            },
          });
        }
      } catch (err) {
        nextAssignmentError = true;
        console.error("Error creating next assignment:", err);
      }
    }

    return NextResponse.json({
      ...result,
      newAchievements,
      nextAssignment: nextAssignment
        ? {
            id: nextAssignment.id,
            memberId: nextAssignment.memberId,
            dueDate: nextAssignment.dueDate,
          }
        : undefined,
      warnings: {
        competitionScoreUpdated,
        nextAssignmentCreated: !nextAssignmentError,
      },
    });
  } catch (error) {
    console.error("POST /api/assignments/[assignmentId]/complete error:", error);

    if (error instanceof Error && error.message === "Not a member of any household") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Error completing assignment" }, { status: 500 });
  }
}
