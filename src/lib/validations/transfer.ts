import { z } from "zod";

export const createTransferSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID requerido"),
  toMemberId: z.string().min(1, "Destinatario requerido"),
  reason: z.string().max(500).optional(),
});

export const respondTransferSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type RespondTransferInput = z.infer<typeof respondTransferSchema>;
