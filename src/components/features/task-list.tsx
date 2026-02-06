"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { Task } from "@prisma/client";

interface TaskListProps {
  tasks: Task[];
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Diaria",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
  ONCE: "Una vez",
};

const WEIGHT_LABELS: Record<number, string> = {
  1: "Muy fácil",
  2: "Fácil",
  3: "Media",
  4: "Difícil",
  5: "Muy difícil",
};

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No hay tareas todavía. Crea tu primera tarea para comenzar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{task.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {task.description && (
              <p className="mb-3 text-sm text-muted-foreground">
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {FREQUENCY_LABELS[task.frequency]}
              </Badge>
              <Badge variant="outline">
                {WEIGHT_LABELS[task.weight] ?? `Peso ${task.weight}`}
              </Badge>
              {task.estimatedMinutes && (
                <Badge variant="outline">{task.estimatedMinutes} min</Badge>
              )}
              {task.minAge && (
                <Badge variant="outline">+{task.minAge} años</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
