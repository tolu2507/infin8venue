// app/onboarding/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingClient from "./onboardingclient";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("ownerId", user.id)
    .maybeSingle();

  if (venue) {
    redirect("/dashboard");
  }

  return <OnboardingClient userEmail={user.email ?? ""} />;
}
