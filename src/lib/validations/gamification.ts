import { z } from "zod";

export const createRewardSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  pointsCost: z
    .number()
    .int()
    .min(1, "El costo mínimo es 1 punto")
    .max(10000, "El costo máximo es 10000 puntos"),
});

export const updateRewardSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional(),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .nullable()
    .optional(),
  pointsCost: z
    .number()
    .int()
    .min(1, "El costo mínimo es 1 punto")
    .max(10000, "El costo máximo es 10000 puntos")
    .optional(),
  isActive: z.boolean().optional(),
});

export const redeemRewardSchema = z.object({
  rewardId: z.string().min(1, "Reward ID es requerido"),
});

export type CreateRewardInput = z.infer<typeof createRewardSchema>;
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;
export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;
