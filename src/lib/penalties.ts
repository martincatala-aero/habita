import { prisma } from "./prisma";
import { PenaltyReason } from "@prisma/client";

const POINTS_BY_REASON: Record<PenaltyReason, number> = {
  OVERDUE_24H: 1,
  OVERDUE_48H: 2,
  OVERDUE_72H: 3,
  TRANSFER_FAILED: 0,
};

const HOURS_THRESHOLDS: { hours: number; reason: PenaltyReason }[] = [
  { hours: 72, reason: "OVERDUE_72H" },
  { hours: 48, reason: "OVERDUE_48H" },
  { hours: 24, reason: "OVERDUE_24H" },
];

/**
 * Aplica penalidades por atraso (24h, 48h, 72h) a asignaciones vencidas.
 * Solo aplica cada umbral una vez por asignación (comprueba si ya existe Penalty con ese assignmentId y reason).
 */
export async function applyOverduePenalties(): Promise<{
  processed: number;
  penaltiesCreated: number;
  errors: string[];
}> {
  const now = new Date();
  const errors: string[] = [];
  let penaltiesCreated = 0;

  const overdueAssignments = await prisma.assignment.findMany({
    where: {
      status: "PENDING",
      dueDate: { lt: now },
    },
    include: {
      member: {
        select: { id: true },
        include: { level: true },
      },
    },
  });

  for (const assignment of overdueAssignments) {
    try {
      const hoursOverdue =
        (now.getTime() - new Date(assignment.dueDate).getTime()) /
        (1000 * 60 * 60);

      for (const { hours, reason } of HOURS_THRESHOLDS) {
        if (hoursOverdue < hours) continue;

        const existing = await prisma.penalty.findFirst({
          where: {
            assignmentId: assignment.id,
            reason,
          },
        });
        if (existing) continue;

        const points = POINTS_BY_REASON[reason];
        await prisma.penalty.create({
          data: {
            memberId: assignment.memberId,
            assignmentId: assignment.id,
            reason,
            points,
            description: `Atraso ≥${hours}h`,
          },
        });
        penaltiesCreated++;

        if (points > 0 && assignment.member.level) {
          const newXp = Math.max(
            0,
            (assignment.member.level.xp ?? 0) - points
          );
          await prisma.memberLevel.update({
            where: { id: assignment.member.level.id },
            data: { xp: newXp },
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Assignment ${assignment.id}: ${message}`);
    }
  }

  return {
    processed: overdueAssignments.length,
    penaltiesCreated,
    errors,
  };
}
