"use client";

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: string;
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="flex items-center gap-1" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={steps.length}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div
            key={step}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ease-out ${
              isCurrent
                ? "bg-primary scale-y-125"
                : isCompleted
                  ? "bg-primary/60"
                  : "bg-muted"
            }`}
            title={step}
          />
        );
      })}
    </div>
  );
}
