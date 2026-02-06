"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle, Users } from "lucide-react";

interface StatsCardsProps {
  completed: number;
  pending: number;
  overdue: number;
  members: number;
}

export function StatsCards({ completed, pending, overdue, members }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold sm:text-sm">Completadas</CardTitle>
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold sm:text-2xl">{completed}</div>
          <p className="text-xs text-muted-foreground">totales</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold sm:text-sm">Pendientes</CardTitle>
          <Clock className="h-4 w-4 shrink-0 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold sm:text-2xl">{pending}</div>
          <p className="text-xs text-muted-foreground">por hacer</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold sm:text-sm">Atrasadas</CardTitle>
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold sm:text-2xl">{overdue}</div>
          <p className="text-xs text-muted-foreground">atención</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold sm:text-sm">Miembros</CardTitle>
          <Users className="h-4 w-4 shrink-0 text-[var(--color-level)]" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold sm:text-2xl">{members}</div>
          <p className="text-xs text-muted-foreground">activos</p>
        </CardContent>
      </Card>
    </div>
  );
}
