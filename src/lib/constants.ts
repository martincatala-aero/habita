/**
 * Shared constants for the application
 * Centralized to avoid duplication across components
 */

import type { TaskFrequency, MemberType } from "@prisma/client";

// ============================================
// FREQUENCY
// ============================================

export const FREQUENCY_LABELS: Record<TaskFrequency, string> = {
  DAILY: "Diaria",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
  ONCE: "Una vez",
};

export const FREQUENCY_OPTIONS = [
  { value: "DAILY", label: "Diario" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quincenal" },
  { value: "MONTHLY", label: "Mensual" },
] as const;

export const FREQUENCY_MULTIPLIERS: Record<TaskFrequency, number> = {
  DAILY: 1.5,
  WEEKLY: 1.0,
  BIWEEKLY: 0.9,
  MONTHLY: 0.8,
  ONCE: 1.0,
};

// ============================================
// MEMBER TYPES
// ============================================

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  ADULT: "Adulto",
  TEEN: "Adolescente",
  CHILD: "Niño",
};

export const MEMBER_TYPE_CAPACITY: Record<MemberType, number> = {
  ADULT: 1.0,
  TEEN: 0.6,
  CHILD: 0.3,
};

// ============================================
// TASK CATEGORIES
// ============================================

export const TASK_CATEGORY_LABELS: Record<string, string> = {
  cleaning: "Limpieza",
  kitchen: "Cocina",
  laundry: "Lavandería",
  rooms: "Habitaciones",
  exterior: "Exterior",
  pets: "Mascotas",
  other: "Otros",
};

export const TASK_CATEGORY_ICONS: Record<string, string> = {
  cleaning: "🧹",
  kitchen: "🍳",
  laundry: "👕",
  rooms: "🛏️",
  exterior: "🌿",
  pets: "🐕",
  other: "📋",
};

// ============================================
// PAGINATION
// ============================================

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const;

// ============================================
// GAMIFICATION
// ============================================

export const XP_PER_LEVEL = 100;

export const POINTS_BASE_MULTIPLIER = 10;

export const BONUS_ON_TIME = 0.2; // +20%
export const BONUS_STREAK = 0.1; // +10% per 3 days
export const STREAK_THRESHOLD = 3;
