import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { isAIEnabled } from "@/lib/llm/provider";
import { SuggestionsPageClient } from "./suggestions-page-client";

export default async function SuggestionsPage() {
  const member = await getCurrentMember();

  if (!member) {
    redirect("/onboarding");
  }

  const aiEnabled = isAIEnabled();

  if (!aiEnabled) {
    redirect("/dashboard");
  }

  return <SuggestionsPageClient memberName={member.name} />;
}
