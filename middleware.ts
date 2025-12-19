/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseAdmin } from "./lib/supabase/server";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const subdomain = hostname.split(".")[0];

  let resellerId = 0; // default SaaS
  let branding = { primaryColor: "#3b82f6", logoUrl: null, font: "Inter" };

  if (subdomain && !["www", "localhost"].includes(subdomain)) {
    const admin = createSupabaseAdmin();
    const { data: reseller } = await admin
      .from("Reseller")
      .select("id, branding")
      .eq("slug", subdomain)
      .single();

    if (reseller) {
      resellerId = reseller.id;
      branding = reseller.branding as any;
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-reseller-id", resellerId.toString());
  response.headers.set("x-branding", JSON.stringify(branding));
  return response;
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};
