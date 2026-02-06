"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid loading the chat widget when not needed
const AiChatWidget = dynamic(
  () => import("./ai-chat-widget").then((mod) => mod.AiChatWidget),
  { ssr: false }
);

interface AiChatWrapperProps {
  enabled: boolean;
}

export function AiChatWrapper({ enabled }: AiChatWrapperProps) {
  if (!enabled) {
    return null;
  }

  return <AiChatWidget />;
}
