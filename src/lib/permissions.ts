import type { MemberType } from "@prisma/client";

/**
 * Define what actions each member type can perform.
 */
export const MEMBER_PERMISSIONS: Record<MemberType, Set<string>> = {
  ADULT: new Set([
    // Full access
    "task:create",
    "task:edit",
    "task:delete",
    "task:assign",
    "assignment:complete",
    "assignment:verify",
    "rotation:manage",
    "reward:create",
    "reward:redeem",
    "transfer:request",
    "transfer:respond",
    "preference:manage",
    "absence:manage",
    "member:manage",
    "parental:access",
  ]),
  TEEN: new Set([
    // Limited access
    "assignment:complete",
    "transfer:request",
    "transfer:respond",
    "preference:manage",
    "reward:redeem",
  ]),
  CHILD: new Set([
    // Very limited access
    "assignment:complete",
    "reward:redeem",
  ]),
};

/**
 * Check if a member type has a specific permission.
 */
export function hasPermission(memberType: MemberType, permission: string): boolean {
  return MEMBER_PERMISSIONS[memberType].has(permission);
}

/**
 * Get all permissions for a member type.
 */
export function getPermissions(memberType: MemberType): string[] {
  return Array.from(MEMBER_PERMISSIONS[memberType]);
}

/**
 * Features available for each member type.
 */
export const MEMBER_FEATURES: Record<MemberType, {
  canManageTasks: boolean;
  canVerifyTasks: boolean;
  canManageRotations: boolean;
  canManageRewards: boolean;
  canTransferTasks: boolean;
  canManagePreferences: boolean;
  canAccessParentalControls: boolean;
  requiresVerification: boolean;
  simplifiedUI: boolean;
}> = {
  ADULT: {
    canManageTasks: true,
    canVerifyTasks: true,
    canManageRotations: true,
    canManageRewards: true,
    canTransferTasks: true,
    canManagePreferences: true,
    canAccessParentalControls: true,
    requiresVerification: false,
    simplifiedUI: false,
  },
  TEEN: {
    canManageTasks: false,
    canVerifyTasks: false,
    canManageRotations: false,
    canManageRewards: false,
    canTransferTasks: true,
    canManagePreferences: true,
    canAccessParentalControls: false,
    requiresVerification: true,
    simplifiedUI: false,
  },
  CHILD: {
    canManageTasks: false,
    canVerifyTasks: false,
    canManageRotations: false,
    canManageRewards: false,
    canTransferTasks: false,
    canManagePreferences: false,
    canAccessParentalControls: false,
    requiresVerification: true,
    simplifiedUI: true,
  },
};

/**
 * Get recommended dashboard for a member type.
 */
export function getRecommendedDashboard(memberType: MemberType): string {
  switch (memberType) {
    case "CHILD":
      return "/kids";
    case "TEEN":
      return "/my-tasks";
    case "ADULT":
    default:
      return "/dashboard";
  }
}
