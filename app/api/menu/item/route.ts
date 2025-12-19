/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/menu/item/route.ts
import { prisma } from "@/lib/db";
import {
  createSupabaseAdmin,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Your existing POST code (unchanged)
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const categoryId = formData.get("categoryId") as string;
    const nameEn = formData.get("name") as string;
    const descriptionEn = formData.get("description") as string | null;
    const price = Number(formData.get("price"));
    const imageFile = formData.get("image") as File | null;

    if (!categoryId || !nameEn || isNaN(price)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;

    if (imageFile && imageFile.size > 0) {
      const supabaseAdmin = createSupabaseAdmin();
      const fileExt = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("menu-images")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("menu-images")
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    const item = await prisma.menuItem.create({
      data: {
        categoryId,
        name: { en: nameEn.trim() },
        description: descriptionEn?.trim()
          ? { en: descriptionEn.trim() }
          : undefined,
        price,
        imageUrl,
        available: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error("Create item error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    // eslint-disable-next-line prefer-const
    let updateData: any = {};

    if (contentType.includes("multipart/form-data")) {
      // Edit with possible image change
      const formData = await request.formData();
      const id = formData.get("id") as string;

      if (!id)
        return NextResponse.json({ error: "Missing ID" }, { status: 400 });

      const nameEn = formData.get("name") as string | null;
      const descriptionEn = formData.get("description") as string | null;
      const priceStr = formData.get("price") as string | null;
      const imageFile = formData.get("image") as File | null;

      if (nameEn !== null) updateData.name = { en: nameEn.trim() };
      if (descriptionEn !== null) {
        updateData.description = descriptionEn.trim()
          ? { en: descriptionEn.trim() }
          : undefined;
      }
      if (priceStr !== null) {
        const price = Number(priceStr);
        if (!isNaN(price)) updateData.price = price;
      }

      if (imageFile && imageFile.size > 0) {
        const supabaseAdmin = createSupabaseAdmin();
        const fileExt = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("menu-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseAdmin.storage
          .from("menu-images")
          .getPublicUrl(fileName);

        updateData.imageUrl = publicUrlData.publicUrl;
      }

      const item = await prisma.menuItem.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json(item);
    } else if (contentType.includes("application/json")) {
      // Toggle availability or other JSON updates
      const body = await request.json();
      const { id, available } = body;

      if (id && available !== undefined) {
        const item = await prisma.menuItem.update({
          where: { id },
          data: { available },
        });
        return NextResponse.json(item);
      }
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    console.error("Update item error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}
