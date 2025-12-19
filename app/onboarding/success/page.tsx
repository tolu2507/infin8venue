// app/onboarding/success/page.tsx
import { redirect } from "next/navigation";

export default function OnboardingSuccess() {
  // Immediate redirect to dashboard with fresh data
  redirect("/dashboard");

  return null;
}
