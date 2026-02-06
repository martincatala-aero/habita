import { NextResponse } from "next/server";
import { applyOverduePenalties } from "@/lib/penalties";
import { processAbsenceRedistribution } from "@/lib/absence-redistribution";

import type { NextRequest } from "next/server";

/**
 * POST /api/cron/process
 * Job programado: (1) penalidades por atraso, (2) redistribución por ausencias (spec §9.2).
 * Protegido por CRON_SECRET si está definido.
 */
export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [penaltyResult, absenceResult] = await Promise.all([
      applyOverduePenalties(),
      processAbsenceRedistribution(),
    ]);

    return NextResponse.json({
      success: true,
      penalties: {
        processed: penaltyResult.processed,
        penaltiesCreated: penaltyResult.penaltiesCreated,
        errors: penaltyResult.errors,
      },
      absences: {
        processedAbsences: absenceResult.processedAbsences,
        reassigned: absenceResult.reassigned,
        postponed: absenceResult.postponed,
        errors: absenceResult.errors,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/cron/process error:", error);
    return NextResponse.json(
      { error: "Error processing cron job" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process
 * Estado del endpoint (monitoreo).
 */
export async function GET() {
  return NextResponse.json({
    status: "ready",
    endpoint: "POST /api/cron/process",
    description:
      "Aplica penalidades por atraso y redistribuye asignaciones por ausencias activas",
  });
}
