"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

import type { MemberType } from "@prisma/client";

interface Assignment {
  id: string;
  completedAt: Date | null;
  task: {
    id: string;
    name: string;
    weight: number;
  };
  member: {
    id: string;
    name: string;
    memberType: MemberType;
  };
}

interface PendingVerificationsProps {
  assignments: Assignment[];
}

export function PendingVerifications({ assignments }: PendingVerificationsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleVerify = async (assignmentId: string, approve: boolean) => {
    setLoadingId(assignmentId);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: approve }),
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => (
        <Card key={assignment.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">{assignment.task.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{assignment.member.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {assignment.member.memberType === "CHILD" ? "Niño" : "Teen"}
                  </Badge>
                  {assignment.completedAt && (
                    <>
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(assignment.completedAt).toLocaleString("es", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">+{assignment.task.weight * 10} pts</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVerify(assignment.id, false)}
                disabled={loadingId === assignment.id}
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <XCircle className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => handleVerify(assignment.id, true)}
                disabled={loadingId === assignment.id}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Verificar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
