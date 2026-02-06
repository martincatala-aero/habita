"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2 } from "lucide-react";

interface ActivityItem {
  id: string;
  taskName: string;
  memberName: string;
  completedAt: Date | string | null;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "";

  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return "ayer";
  return `hace ${diffDays} días`;
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Actividad reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay actividad reciente esta semana
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Actividad reciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.memberName}</span>
                  {" completó "}
                  <span className="font-medium">{activity.taskName}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(activity.completedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
