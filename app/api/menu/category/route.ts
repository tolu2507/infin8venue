// app/api/menu/category/route.ts
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
    const { name } = body; // { en: "Starters" }

    // Get user's venue
    const venue = await prisma.venue.findFirst({
      where: { ownerId: user.id },
      select: { id: true },
    });

    if (!venue) {
      return NextResponse.json({ error: "No venue found" }, { status: 404 });
    }

    // Get default branch (first branch of venue)
    const branch = await prisma.branch.findFirst({
      where: { venueId: venue.id },
      select: { id: true },
    });

    if (!branch) {
      return NextResponse.json({ error: "No branch found" }, { status: 404 });
    }

    const category = await prisma.menuCategory.create({
      data: {
        branchId: branch.id,
        name,
        order: 99,
        isActive: true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name } = body; // name is string, we wrap in { en: ... }

    const category = await prisma.menuCategory.update({
      where: { id },
      data: {
        name: { en: name },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}
