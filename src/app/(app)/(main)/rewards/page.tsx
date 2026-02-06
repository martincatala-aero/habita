import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RewardsList } from "@/components/features/rewards-list";
import { CreateRewardButton } from "@/components/features/create-reward-button";
import { Gift, Coins } from "lucide-react";

export default async function RewardsPage() {
  const member = await getCurrentMember();

  if (!member) {
    redirect("/onboarding");
  }

  const rewards = await prisma.householdReward.findMany({
    where: {
      householdId: member.householdId,
      isActive: true,
    },
    orderBy: { pointsCost: "asc" },
  });

  // Calculate available points
  const level = await prisma.memberLevel.findUnique({
    where: { memberId: member.id },
  });

  const redemptions = await prisma.rewardRedemption.findMany({
    where: { memberId: member.id },
    include: {
      reward: {
        select: { pointsCost: true, name: true },
      },
    },
    orderBy: { redeemedAt: "desc" },
  });

  const spentPoints = redemptions.reduce((sum, r) => sum + r.reward.pointsCost, 0);
  const availablePoints = (level?.xp ?? 0) - spentPoints;

  const pendingRedemptions = redemptions.filter((r) => !r.isFulfilled);

  return (
    <div className="container max-w-4xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Recompensas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Canjea tus puntos por recompensas
          </p>
        </div>
        <CreateRewardButton />
      </div>

      {/* Points Summary */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="h-5 w-5 text-yellow-500" />
              Puntos disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{availablePoints}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Puntos totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{level?.xp ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Puntos canjeados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{spentPoints}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Redemptions */}
      {pendingRedemptions.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Canjes pendientes</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {pendingRedemptions.map((r) => (
              <Card key={r.id} className="border-yellow-500/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{r.reward.name}</CardTitle>
                  <CardDescription>
                    Canjeado el {new Date(r.redeemedAt).toLocaleDateString("es")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">Pendiente de entrega</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Rewards */}
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <Gift className="h-5 w-5" />
        Recompensas disponibles
      </h2>
      <RewardsList rewards={rewards} availablePoints={availablePoints} />
    </div>
  );
}
