"use client";

import { useState, useEffect } from "react";
import { WeeklyCelebration } from "./weekly-celebration";

interface WeeklyCelebrationWrapperProps {
  weeklyCompleted: number;
  totalCompleted: number;
}

const CELEBRATION_STORAGE_KEY = "habita-celebration-dismissed";

export function WeeklyCelebrationWrapper({
  weeklyCompleted,
  totalCompleted,
}: WeeklyCelebrationWrapperProps) {
  const [dismissed, setDismissed] = useState(true); // Start dismissed to avoid flash

  useEffect(() => {
    // Check if dismissed this week
    const storedDate = localStorage.getItem(CELEBRATION_STORAGE_KEY);
    if (storedDate) {
      const dismissedDate = new Date(storedDate);
      const now = new Date();
      // Reset on Sunday (start of new week)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      if (dismissedDate >= startOfWeek) {
        setDismissed(true);
        return;
      }
    }
    setDismissed(false);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(CELEBRATION_STORAGE_KEY, new Date().toISOString());
  };

  if (dismissed) {
    return null;
  }

  return (
    <WeeklyCelebration
      weeklyCompleted={weeklyCompleted}
      totalCompleted={totalCompleted}
      onDismiss={handleDismiss}
    />
  );
}
