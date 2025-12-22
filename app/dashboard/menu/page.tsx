/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/menu/page.tsx
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MenuClient from "./menus";

export default async function MenuPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get user's venue
  const venue = await prisma.venue.findFirst({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (!venue) redirect("/onboarding");

  // Get first branch (or add selector later)
  const defaultBranch = await prisma.branch.findFirst({
    where: { venueId: venue.id },
  });

  if (!defaultBranch) {
    // Handle no branch — maybe show message
    return <div>No branch found. Please contact support.</div>;
  }

  // Use Prisma — it handles relations perfectly
  const categories = await prisma.menuCategory.findMany({
    where: { branchId: defaultBranch.id },
    include: { items: true },
    orderBy: { order: "asc" },
  });

  const totalItems = categories.reduce((acc:number, cat) => acc + cat.items.length, 0);
  const activeItems = categories.reduce(
    (acc:number, cat) => acc + cat.items.filter((i: any) => i.available).length,
    0
  );

  const serializedCategories = categories.map((cat) => ({
    ...cat,
    items: cat.items.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  }));

  return (
    <MenuClient
      categories={serializedCategories}
      totalItems={totalItems || 0}
      activeItems={activeItems || 0}
    />
  );
}
