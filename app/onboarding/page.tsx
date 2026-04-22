import * as React from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default async function OnboardingPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();
  if (user.onboardedAt) redirect("/?welcome=0");
  return <OnboardingFlow userName={user.name ?? null} />;
}
