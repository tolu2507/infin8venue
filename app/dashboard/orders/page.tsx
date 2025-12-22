/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/orders/page.tsx
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LiveOrdersClient from "./liveorderclient";

export const dynamic = "force-dynamic";

export default async function LiveOrdersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const venue = await prisma.venue.findFirst({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (!venue) redirect("/onboarding");

  const orders = await prisma.order.findMany({
    where: {
      branch: { venueId: venue.id },
    },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
      table: {
        select: { number: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log({orders})

  const serializedOrders = orders.map((order:any) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    total: Number(order.total),
    tip: order.tip ? Number(order.tip) : 0,
    notes: order.notes || "",
    tableNumber: order.table?.number || "Walk-in",
    items: order.items.map((item:any) => ({
      quantity: item.quantity,
      name: item.itemName,
      price: Number(item.priceAtOrder),
      subtotal: Number(item.subtotal),
    })),
    createdAt: order.createdAt.toISOString(),
  }));

  return (
    <LiveOrdersClient initialOrders={serializedOrders} />
  );
}
