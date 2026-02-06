import { z } from "zod";

export const penaltyReasonSchema = z.enum([
  "OVERDUE_24H",
  "OVERDUE_48H",
  "OVERDUE_72H",
  "TRANSFER_FAILED",
]);

export const PENALTY_POINTS: Record<z.infer<typeof penaltyReasonSchema>, number> = {
  OVERDUE_24H: 5,
  OVERDUE_48H: 10,
  OVERDUE_72H: 20,
  TRANSFER_FAILED: 5,
};

export const PENALTY_DESCRIPTIONS: Record<z.infer<typeof penaltyReasonSchema>, string> = {
  OVERDUE_24H: "Tarea atrasada más de 24 horas",
  OVERDUE_48H: "Tarea atrasada más de 48 horas",
  OVERDUE_72H: "Tarea atrasada más de 72 horas",
  TRANSFER_FAILED: "Transferencia de tarea fallida",
};

export type PenaltyReason = z.infer<typeof penaltyReasonSchema>;
