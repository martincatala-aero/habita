"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Sparkles, Star } from "lucide-react";

import type { Assignment, Task } from "@prisma/client";

interface AssignmentWithTask extends Assignment {
  task: Pick<Task, "id" | "name" | "description" | "weight" | "estimatedMinutes">;
}

interface KidsTaskListProps {
  assignments: AssignmentWithTask[];
}

const TASK_COLORS = [
  "from-blue-400 to-blue-600",
  "from-green-400 to-green-600",
  "from-purple-400 to-purple-600",
  "from-pink-400 to-pink-600",
  "from-orange-400 to-orange-600",
  "from-teal-400 to-teal-600",
];

const TASK_EMOJIS = ["🧹", "🍽️", "🛏️", "📚", "🧺", "🌱", "🐕", "🚿", "🧸", "✨"];

export function KidsTaskList({ assignments }: KidsTaskListProps) {
  if (assignments.length === 0) {
    return (
      <Card className="border-4 border-green-400 bg-green-50 dark:bg-green-950">
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-200">
            <Star className="h-12 w-12 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            ¡Excelente trabajo!
          </p>
          <p className="mt-2 text-lg text-green-600 dark:text-green-400">
            Has completado todas tus tareas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Mis tareas</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {assignments.map((assignment, index) => {
          const colorIndex = index % TASK_COLORS.length;
          const emojiIndex = index % TASK_EMOJIS.length;
          return (
            <KidsTaskCard
              key={assignment.id}
              assignment={assignment}
              colorClass={TASK_COLORS[colorIndex] ?? "from-blue-400 to-blue-600"}
              emoji={TASK_EMOJIS[emojiIndex] ?? "✨"}
            />
          );
        })}
      </div>
    </div>
  );
}

function KidsTaskCard({
  assignment,
  colorClass,
  emoji,
}: {
  assignment: AssignmentWithTask;
  colorClass: string;
  emoji: string;
}) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const response = await fetch(`/api/assignments/${assignment.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => router.refresh(), 1500);
        return;
      }
      setIsCompleting(false);
    } catch {
      setIsCompleting(false);
    }
  };

  if (showSuccess) {
    return (
      <Card className="overflow-hidden border-4 border-green-400">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Sparkles className="mb-4 h-16 w-16 animate-bounce text-yellow-500" />
          <p className="text-2xl font-bold text-green-600">¡Muy bien!</p>
          <p className="text-lg text-muted-foreground">
            +{assignment.task.weight * 10} puntos
          </p>
        </CardContent>
      </Card>
    );
  }

  const points = assignment.task.weight * 10;
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  return (
    <Card
      className={`overflow-hidden border-4 ${isOverdue ? "border-red-400" : "border-transparent"}`}
    >
      <div className={`bg-gradient-to-r ${colorClass} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <span className="text-4xl">{emoji}</span>
          <div className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
            +{points} ⭐
          </div>
        </div>
        <h3 className="mt-2 text-xl font-bold">{assignment.task.name}</h3>
      </div>
      <CardContent className="p-4">
        {assignment.task.description && (
          <p className="mb-3 text-muted-foreground">{assignment.task.description}</p>
        )}

        <div className="mb-4 flex items-center gap-4 text-sm">
          {assignment.task.estimatedMinutes && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {assignment.task.estimatedMinutes} min
            </div>
          )}
          {isOverdue && (
            <div className="font-medium text-red-500">¡Hay que hacerla!</div>
          )}
        </div>

        <Button
          onClick={handleComplete}
          disabled={isCompleting}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 py-6 text-lg font-bold hover:from-green-600 hover:to-emerald-600"
        >
          {isCompleting ? (
            "..."
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-6 w-6" />
              ¡Ya lo hice!
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
