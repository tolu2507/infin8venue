/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/onboarding/venue/route.ts
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
// import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, branchName = "Main Branch" } = body; // Default if not provided

    // Check if slug is taken
    const existing = await prisma.venue.findFirst({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This URL is already taken. Try a different name." },
        { status: 400 }
      );
    }

    // Create venue
    const venue = await prisma.venue.create({
      data: {
        name,
        slug,
        ownerId: user.id,
      },
    });

    // Create branch with dynamic name
    await prisma.branch.create({
      data: {
        venueId: venue.id,
        name: branchName, // ← Now dynamic!
      },
    });

    // Fix redirect loop
    // revalidatePath("/dashboard");

    return NextResponse.json({ success: true, venue });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create venue" },
      { status: 500 }
    );
  }
}
