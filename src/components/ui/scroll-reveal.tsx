"use client";

import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

import type { ReactNode } from "react";

export function ScrollReveal({ children, className }: { children: ReactNode; className?: string }) {
  const { elementRef, isVisible } = useIntersectionObserver();

  return (
    <div
      ref={elementRef}
      className={`${isVisible ? "animate-reveal-up" : "opacity-0"} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
