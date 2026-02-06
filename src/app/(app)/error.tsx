"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/features/error-states";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="container py-8">
      <ErrorState
        title="Algo salió mal"
        message="Ha ocurrido un error al cargar esta página. Por favor, intenta de nuevo."
        retry={reset}
        showHomeButton
      />
    </div>
  );
}
