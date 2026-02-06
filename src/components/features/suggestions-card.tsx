"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  Clock,
  Lightbulb,
  ListTodo,
  RefreshCw,
  ChevronRight,
  Loader2,
  Sun,
  Moon,
  Sunrise,
  Sunset,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestionItem {
  type: "hero" | "chip" | "tip" | "action";
  title: string;
  description?: string;
  priority?: "high" | "medium" | "low";
  icon?: string;
  actionLabel?: string;
  actionHref?: string;
}

interface SuggestionsResponse {
  headline: string;
  subheadline?: string;
  items: SuggestionItem[];
  contextSummary: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "alert-triangle": AlertTriangle,
  "calendar-days": CalendarDays,
  "check-circle": CheckCircle,
  clock: Clock,
  lightbulb: Lightbulb,
  "list-todo": ListTodo,
  sun: Sun,
  moon: Moon,
  sunrise: Sunrise,
  sunset: Sunset,
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  medium: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  low: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
};

function getIcon(iconName?: string) {
  if (!iconName) return null;
  const IconComponent = ICON_MAP[iconName];
  return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
}

export function SuggestionsCard() {
  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/suggestions");

      if (response.status === 503) {
        setError("not_configured");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const result = (await response.json()) as SuggestionsResponse;
      setData(result);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setError("fetch_error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Don't render if not configured
  if (error === "not_configured") {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Cargando sugerencias...
          </span>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error === "fetch_error") {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-between py-4">
          <span className="text-sm text-muted-foreground">
            No se pudieron cargar las sugerencias
          </span>
          <Button variant="ghost" size="sm" onClick={fetchSuggestions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const heroItem = data.items.find((i) => i.type === "hero");
  const chips = data.items.filter((i) => i.type === "chip");
  const tips = data.items.filter((i) => i.type === "tip");
  const actions = data.items.filter((i) => i.type === "action");

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
      <CardContent className="p-0">
        {/* Header with headline */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">{data.headline}</h2>
              {data.subheadline && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {data.subheadline}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchSuggestions}
              className="h-8 w-8 shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Hero item */}
        {heroItem && (
          <div
            className={cn(
              "mx-4 mb-3 rounded-lg border p-3",
              heroItem.priority ? PRIORITY_STYLES[heroItem.priority] : "bg-muted/50"
            )}
          >
            <div className="flex items-start gap-3">
              {getIcon(heroItem.icon) && (
                <div className="mt-0.5">{getIcon(heroItem.icon)}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium">{heroItem.title}</p>
                {heroItem.description && (
                  <p className="text-sm opacity-80 mt-0.5">{heroItem.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chips */}
        {chips.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {chips.map((chip, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="gap-1.5 py-1 px-2.5"
              >
                {getIcon(chip.icon)}
                <span>{chip.title}</span>
                {chip.description && (
                  <span className="text-muted-foreground font-normal">
                    {chip.description}
                  </span>
                )}
              </Badge>
            ))}
          </div>
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <div className="px-4 pb-3 space-y-2">
            {tips.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">{tip.title}</span>
                  {tip.description && <span> — {tip.description}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="border-t bg-muted/30 p-3 flex flex-wrap gap-2">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                asChild
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Link href={action.actionHref ?? "#"}>
                  {getIcon(action.icon)}
                  {action.actionLabel ?? action.title}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </Button>
            ))}
          </div>
        )}

        {/* Footer link to detail */}
        <Link
          href="/suggestions"
          className="block border-t px-4 py-2.5 text-center text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          Ver más detalles
          <ChevronRight className="inline-block h-3 w-3 ml-1" />
        </Link>
      </CardContent>
    </Card>
  );
}
