"use client";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Diario",
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};

export interface CatalogTaskItemData {
  name: string;
  icon: string;
  defaultFrequency: string;
  defaultWeight?: number;
  estimatedMinutes?: number | null;
  minAge?: number | null;
  selected?: boolean;
}

interface CatalogTaskItemProps {
  task: CatalogTaskItemData;
  onToggle: () => void;
}

export function CatalogTaskItem({ task, onToggle }: CatalogTaskItemProps) {
  const frequencyLabel =
    FREQUENCY_LABELS[task.defaultFrequency] ?? task.defaultFrequency;
  const isSelected = !!task.selected;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-transparent bg-muted/30 hover:bg-muted/50"
      }`}
    >
      <span className="text-xl" aria-hidden>
        {task.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{task.name}</p>
        <p className="text-sm text-muted-foreground">{frequencyLabel}</p>
      </div>
      <div
        className={`h-5 w-5 shrink-0 rounded-full border-2 ${
          isSelected ? "border-primary bg-primary" : "border-muted-foreground"
        }`}
        aria-hidden
      />
    </button>
  );
}
