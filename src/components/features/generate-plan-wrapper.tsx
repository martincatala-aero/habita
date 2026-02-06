"use client";

import dynamic from "next/dynamic";

const GeneratePlanButton = dynamic(
  () => import("./generate-plan-button").then((mod) => mod.GeneratePlanButton),
  { ssr: false }
);

interface GeneratePlanWrapperProps {
  enabled: boolean;
}

export function GeneratePlanWrapper({ enabled }: GeneratePlanWrapperProps) {
  if (!enabled) {
    return null;
  }

  return <GeneratePlanButton />;
}
