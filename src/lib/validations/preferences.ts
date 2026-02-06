import { z } from "zod";

export const preferenceTypeSchema = z.enum(["PREFERRED", "NEUTRAL", "DISLIKED"]);

export const setPreferenceSchema = z.object({
  taskId: z.string().min(1, "Task ID es requerido"),
  preference: preferenceTypeSchema,
});

export const createAbsenceSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().max(200).optional(),
});

export const updateAbsenceSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  reason: z.string().max(200).nullable().optional(),
});

export type PreferenceType = z.infer<typeof preferenceTypeSchema>;
export type SetPreferenceInput = z.infer<typeof setPreferenceSchema>;
export type CreateAbsenceInput = z.infer<typeof createAbsenceSchema>;
export type UpdateAbsenceInput = z.infer<typeof updateAbsenceSchema>;
