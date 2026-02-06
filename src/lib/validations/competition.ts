import { z } from "zod";

export const competitionDurationSchema = z.enum(["WEEK", "MONTH", "CUSTOM"]);

export const createCompetitionSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  duration: competitionDurationSchema,
  prize: z
    .string()
    .max(200, "El premio no puede exceder 200 caracteres")
    .optional(),
  customEndDate: z.string().datetime().optional(),
});

export const updateCompetitionSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100)
    .optional(),
  description: z
    .string()
    .max(500)
    .nullable()
    .optional(),
  prize: z
    .string()
    .max(200)
    .nullable()
    .optional(),
});

export const endCompetitionSchema = z.object({
  competitionId: z.string().min(1, "Competition ID es requerido"),
});

export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;
export type UpdateCompetitionInput = z.infer<typeof updateCompetitionSchema>;
export type EndCompetitionInput = z.infer<typeof endCompetitionSchema>;
