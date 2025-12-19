/* eslint-disable @typescript-eslint/no-unused-vars */
// app/menu/payment-success/page.tsx
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default async function PaymentSuccess({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams?.session_id;
console.log("Payment Success Session ID:", sessionId);
//   if (!sessionId) {
//     redirect("/menu");
//   }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Find the latest open order for this user/table (or from session metadata)
  const openOrder = await prisma.order.findFirst({
    where: {
      paymentStatus: "PENDING",
      status: { not: "CLOSED" },
    },
    orderBy: { createdAt: "desc" },
  });

  if (openOrder) {
    // Mark as paid and closed
    await prisma.order.update({
      where: { id: openOrder.id },
      data: {
        paymentStatus: "PAID",
        status: "CLOSED",
        stripeSessionId: sessionId,
        paidAt: new Date(),
      },
    });
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle2 className="h-24 w-24 text-cyan-400 mx-auto mb-8" />
        <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-xl text-gray-300 mb-8">
          Thank you for your order. Your payment has been processed.
        </p>
        <p className="text-lg text-gray-400 mb-12">
          Your food is being prepared. Enjoy your meal!
        </p>
        <div className="text-sm text-gray-500">
          Order #{openOrder?.orderNumber || "NEW"}
        </div>
      </div>
    </div>
  );
}
