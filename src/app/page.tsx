import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentMember } from "@/lib/session";
import { getRecommendedDashboard } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  CheckCircle2,
  Users,
  Trophy,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  // If logged in, check if they have a household
  if (session?.user) {
    const member = await getCurrentMember();

    if (member) {
      // Redirect based on member type
      const dashboard = getRecommendedDashboard(member.memberType);
      redirect(dashboard);
    } else {
      redirect("/onboarding");
    }
  }

  // Not logged in - show landing page
  return (
    <main className="min-h-screen">
      {/* Hero Section - mobile first */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container flex min-h-[85vh] flex-col items-center justify-center px-4 py-12 text-center sm:py-20">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 shadow-sm sm:h-24 sm:w-24">
            <span className="text-5xl sm:text-6xl">🏠</span>
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:mb-4 sm:text-5xl lg:text-6xl">
            Habita
          </h1>
          <p className="mb-6 max-w-2xl text-base text-muted-foreground sm:mb-8 sm:text-lg lg:text-xl">
            La forma divertida de gestionar las tareas del hogar. Organiza, gana XP y motiva a toda la familia.
          </p>
          <div className="flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login">
                Comenzar gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border/60 bg-muted/30 py-12 sm:py-20">
        <div className="container px-4">
          <h2 className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl">
            Todo lo que tu hogar necesita
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />}
              title="Gestión de tareas"
              description="Crea, asigna y rastrea todas las tareas del hogar en un solo lugar."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8 text-[var(--color-level)]" />}
              title="Colaboración familiar"
              description="Invita a todos los miembros de tu hogar y distribuye las responsabilidades."
            />
            <FeatureCard
              icon={<Trophy className="h-8 w-8 text-[var(--color-xp)]" />}
              title="Gamificación"
              description="Gana XP, sube de nivel y desbloquea logros al completar tareas."
            />
            <FeatureCard
              icon={<RefreshCw className="h-8 w-8 text-primary" />}
              title="Rotaciones automáticas"
              description="Configura asignaciones automáticas para tareas recurrentes."
            />
          </div>
        </div>
      </section>

      {/* For Kids Section */}
      <section className="border-t border-border/60 py-12 sm:py-20">
        <div className="container px-4">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                Modo niños
              </div>
              <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
                Diseñado para toda la familia
              </h2>
              <p className="mb-6 text-muted-foreground sm:text-lg">
                Los más pequeños tienen su propia interfaz simplificada con
                colores llamativos, emojis y animaciones. Los padres pueden
                verificar las tareas completadas y configurar controles parentales.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-success)]" />
                  <span>Interfaz divertida para niños</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-success)]" />
                  <span>Verificación parental de tareas</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-success)]" />
                  <span>Recompensas personalizables</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6 sm:p-8">
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🧹</span>
                    <div>
                      <p className="font-medium">Ordenar mi cuarto</p>
                      <p className="text-sm text-muted-foreground">+20 puntos</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🍽️</span>
                    <div>
                      <p className="font-medium">Poner la mesa</p>
                      <p className="text-sm text-muted-foreground">+10 puntos</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-primary/20 bg-primary py-12 text-primary-foreground sm:py-20">
        <div className="container px-4 text-center">
          <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl">
            Comienza a organizar tu hogar hoy
          </h2>
          <p className="mb-6 text-base opacity-90 sm:mb-8 sm:text-lg">
            Es gratis y solo toma un minuto configurarlo.
          </p>
          <Button asChild size="lg" variant="secondary" className="w-full max-w-xs sm:w-auto">
            <Link href="/login">
              Crear mi hogar
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 sm:py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>Habita — Gestión colaborativa de tareas del hogar</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-2 border-border/60 bg-card">
      <CardContent className="pt-6">
        <div className="mb-4">{icon}</div>
        <h3 className="mb-2 text-lg font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
      </CardContent>
    </Card>
  );
}
