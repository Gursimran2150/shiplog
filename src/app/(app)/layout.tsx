import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { CommandMenu } from "@/features/commands/CommandMenu";
import { OnboardingTour } from "@/features/onboarding/OnboardingTour";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell actions={<CommandMenu />}>
      {children}
      <OnboardingTour />
    </AppShell>
  );
}
