// app/api/payment/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function POST(request: Request) {
  const body = await request.json();
  const { amount, tableNumber, venueName } = body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Bill for ${tableNumber} at ${venueName}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/menu/payment-success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/menu/payment-cancel`,
  });

  return NextResponse.json({ url: session.url });
}
