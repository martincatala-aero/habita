"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Sparkles, Loader2, Wand2 } from "lucide-react";

interface GeneratePlanResult {
  success: boolean;
  assignmentsCreated: number;
  plan?: {
    assignments: Array<{ taskName: string; memberName: string; reason: string }>;
    balanceScore: number;
    notes: string[];
  };
  error?: string;
}

export function GeneratePlanButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleGeneratePlan = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 503) {
        toast.error(
          "IA no configurada",
          "Configura ANTHROPIC_API_KEY para usar esta función"
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }

      const result = (await response.json()) as GeneratePlanResult;

      if (result.success && result.assignmentsCreated > 0) {
        toast.success(
          "¡Plan generado!",
          `Se asignaron ${result.assignmentsCreated} tareas automáticamente`
        );
        router.refresh();
      } else if (result.assignmentsCreated === 0) {
        toast.info(
          "Sin cambios",
          "Todas las tareas ya están asignadas o no hay tareas disponibles"
        );
      } else {
        toast.error("Error", result.error ?? "No se pudo generar el plan");
      }
    } catch (error) {
      console.error("Generate plan error:", error);
      toast.error("Error", "No se pudo generar el plan. Intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGeneratePlan}
      disabled={isGenerating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Wand2 className="h-4 w-4" />
          Generar plan con IA
        </>
      )}
    </Button>
  );
}
