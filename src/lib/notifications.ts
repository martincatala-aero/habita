import { prisma } from "./prisma";

import type { MemberType, TransferStatus } from "@prisma/client";

export interface Notification {
  id: string;
  type: "transfer_request" | "transfer_accepted" | "transfer_rejected" | "task_overdue" | "achievement_unlocked" | "level_up";
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

interface TransferWithDetails {
  id: string;
  status: TransferStatus;
  requestedAt: Date;
  respondedAt: Date | null;
  assignment: {
    task: {
      name: string;
    };
  };
  fromMember: {
    id: string;
    name: string;
  };
  toMember: {
    id: string;
    name: string;
  };
}

interface AssignmentWithTask {
  id: string;
  dueDate: Date | null;
  task: {
    name: string;
  };
}

interface AchievementWithDetails {
  id: string;
  unlockedAt: Date;
  achievement: {
    name: string;
    description: string;
  };
}

interface MemberLevelData {
  level: number;
  xp: number;
  updatedAt: Date;
}

/**
 * Generate notifications for a member based on their data.
 * This is computed on-the-fly rather than stored.
 */
export async function getNotificationsForMember(memberId: string): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get member info
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { level: true },
  });

  if (!member) return notifications;

  // 1. Pending transfer requests (received)
  const pendingTransfers = await prisma.taskTransfer.findMany({
    where: {
      toMemberId: memberId,
      status: "PENDING",
    },
    include: {
      assignment: {
        include: {
          task: { select: { name: true } },
        },
      },
      fromMember: { select: { id: true, name: true } },
      toMember: { select: { id: true, name: true } },
    },
    orderBy: { requestedAt: "desc" },
  }) as TransferWithDetails[];

  for (const transfer of pendingTransfers) {
    notifications.push({
      id: `transfer-pending-${transfer.id}`,
      type: "transfer_request",
      title: "Solicitud de transferencia",
      message: `${transfer.fromMember.name} quiere transferirte "${transfer.assignment.task.name}"`,
      createdAt: transfer.requestedAt,
      read: false,
      actionUrl: "/my-tasks",
    });
  }

  // 2. Recent transfer responses (for sent transfers)
  const recentTransferResponses = await prisma.taskTransfer.findMany({
    where: {
      fromMemberId: memberId,
      status: { in: ["ACCEPTED", "REJECTED"] },
      respondedAt: { gte: oneDayAgo },
    },
    include: {
      assignment: {
        include: {
          task: { select: { name: true } },
        },
      },
      fromMember: { select: { id: true, name: true } },
      toMember: { select: { id: true, name: true } },
    },
    orderBy: { respondedAt: "desc" },
  }) as TransferWithDetails[];

  for (const transfer of recentTransferResponses) {
    const accepted = transfer.status === "ACCEPTED";
    notifications.push({
      id: `transfer-response-${transfer.id}`,
      type: accepted ? "transfer_accepted" : "transfer_rejected",
      title: accepted ? "Transferencia aceptada" : "Transferencia rechazada",
      message: accepted
        ? `${transfer.toMember.name} aceptó "${transfer.assignment.task.name}"`
        : `${transfer.toMember.name} rechazó "${transfer.assignment.task.name}"`,
      createdAt: transfer.respondedAt ?? transfer.requestedAt,
      read: false,
      actionUrl: "/my-tasks",
    });
  }

  // 3. Overdue tasks
  const overdueTasks = await prisma.assignment.findMany({
    where: {
      memberId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      dueDate: { lt: now },
    },
    include: {
      task: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  }) as AssignmentWithTask[];

  for (const assignment of overdueTasks) {
    if (assignment.dueDate) {
      notifications.push({
        id: `overdue-${assignment.id}`,
        type: "task_overdue",
        title: "Tarea atrasada",
        message: `"${assignment.task.name}" está atrasada`,
        createdAt: assignment.dueDate,
        read: false,
        actionUrl: "/my-tasks",
      });
    }
  }

  // 4. Recent achievements
  const recentAchievements = await prisma.memberAchievement.findMany({
    where: {
      memberId,
      unlockedAt: { gte: oneWeekAgo },
    },
    include: {
      achievement: { select: { name: true, description: true } },
    },
    orderBy: { unlockedAt: "desc" },
  }) as AchievementWithDetails[];

  for (const memberAchievement of recentAchievements) {
    notifications.push({
      id: `achievement-${memberAchievement.id}`,
      type: "achievement_unlocked",
      title: "Logro desbloqueado",
      message: `${memberAchievement.achievement.name}: ${memberAchievement.achievement.description}`,
      createdAt: memberAchievement.unlockedAt,
      read: false,
      actionUrl: "/profile",
    });
  }

  // 5. Level ups (check if level changed recently based on updatedAt)
  if (member.level) {
    const levelData = member.level as MemberLevelData;
    if (levelData.updatedAt >= oneDayAgo && levelData.level > 1) {
      notifications.push({
        id: `levelup-${memberId}-${levelData.level}`,
        type: "level_up",
        title: "Subiste de nivel",
        message: `Alcanzaste el nivel ${levelData.level}`,
        createdAt: levelData.updatedAt,
        read: false,
        actionUrl: "/profile",
      });
    }
  }

  // Sort all notifications by date
  notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return notifications;
}

/**
 * Get unread notification count for a member.
 */
export async function getUnreadNotificationCount(memberId: string): Promise<number> {
  const notifications = await getNotificationsForMember(memberId);
  return notifications.filter((n) => !n.read).length;
}
