"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast";
import { Coins } from "lucide-react";

import type { HouseholdReward } from "@prisma/client";

interface RewardsListProps {
  rewards: HouseholdReward[];
  availablePoints: number;
}

export function RewardsList({ rewards, availablePoints }: RewardsListProps) {
  if (rewards.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No hay recompensas configuradas. ¡Crea la primera recompensa!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {rewards.map((reward) => (
        <RewardCard
          key={reward.id}
          reward={reward}
          canAfford={availablePoints >= reward.pointsCost}
        />
      ))}
    </div>
  );
}

interface RedeemResponse {
  pointsSpent: number;
  remainingPoints: number;
}

function RewardCard({
  reward,
  canAfford,
}: {
  reward: HouseholdReward;
  canAfford: boolean;
}) {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleRedeem = async () => {
    if (!canAfford || isRedeeming) return;

    setIsRedeeming(true);
    try {
      const response = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });

      if (response.ok) {
        const data = await response.json() as RedeemResponse;
        toast.success(
          `¡${reward.name} canjeado!`,
          `Gastaste ${data.pointsSpent} puntos. Te quedan ${data.remainingPoints} puntos.`
        );
        router.refresh();
      } else {
        const errorData = await response.json() as { error?: string };
        toast.error("Error al canjear", errorData.error ?? "Intenta de nuevo");
      }
    } catch {
      toast.error("Error al canjear", "Intenta de nuevo");
    } finally {
      setIsRedeeming(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Card className={!canAfford ? "opacity-60" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{reward.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {reward.description && (
            <p className="mb-3 text-sm text-muted-foreground">{reward.description}</p>
          )}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {reward.pointsCost} pts
            </Badge>
            <Button
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={!canAfford || isRedeeming}
            >
              {isRedeeming ? "..." : "Canjear"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar canje</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Canjear &quot;{reward.name}&quot; por {reward.pointsCost} puntos?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRedeeming}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRedeem} disabled={isRedeeming}>
              {isRedeeming ? "Canjeando..." : "Canjear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
