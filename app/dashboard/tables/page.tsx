// app/dashboard/tables/page.tsx
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TablesClient from "./tablesclient";

export default async function TablesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const venue = await prisma.venue.findFirst({
    where: { ownerId: user.id },
  });

  if (!venue) redirect("/onboarding");

  const branch = await prisma.branch.findFirst({
    where: { venueId: venue.id },
  });

  if (!branch) {
    return <div>No branch found.</div>;
  }

  const tables = await prisma.table.findMany({
    where: { branchId: branch.id },
    orderBy: { number: "asc" },
  });

  return <TablesClient tables={tables} branchId={branch.id} />;
}
