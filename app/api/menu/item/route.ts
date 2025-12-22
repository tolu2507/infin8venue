/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/menu/item/route.ts
import { prisma } from "@/lib/db";
import {
  createSupabaseAdmin,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
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

    const formData = await request.formData();

    const categoryId = formData.get("categoryId") as string;
    const nameEn = formData.get("name") as string;
    const descriptionEn = formData.get("description") as string | null;
    const priceStr = formData.get("price") as string;
    const imageFile = formData.get("image") as File | null;

    if (!categoryId || !nameEn || !priceStr) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const price = Number(priceStr);
    if (isNaN(price)) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
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

    // Build modifiers from form
    const modifiers = [];
    for (let i = 0; i < 3; i++) {
      const name = formData.get(`modifier_name_${i}`) as string;
      const optionsStr = formData.get(`modifier_options_${i}`) as string;
      if (name && optionsStr) {
        const options = optionsStr
          .split(",")
          .map((o: string) => o.trim())
          .filter(Boolean);
        if (options.length > 0) {
          modifiers.push({
            name: { en: name.trim() },
            options,
          });
        }
      }
    }

    // Create item first
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

    // Then create modifiers linked to item
    if (modifiers.length > 0) {
      await prisma.modifier.createMany({
        data: modifiers.map((mod) => ({
          itemId: item.id,
          name: mod.name,
          options: mod.options,
        })),
      });
    }

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

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const id = formData.get("id") as string;

      if (!id)
        return NextResponse.json({ error: "Missing ID" }, { status: 400 });

      const nameEn = formData.get("name") as string | null;
      const descriptionEn = formData.get("description") as string | null;
      const priceStr = formData.get("price") as string | null;
      const imageFile = formData.get("image") as File | null;

      let updateData: any = {};

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

      // Update item
      const item = await prisma.menuItem.update({
        where: { id },
        data: updateData,
      });

      // Update modifiers: delete old, create new
      await prisma.modifier.deleteMany({ where: { itemId: id } });

      const modifiers = [];
      for (let i = 0; i < 3; i++) {
        const name = formData.get(`modifier_name_${i}`) as string;
        const optionsStr = formData.get(`modifier_options_${i}`) as string;
        if (name && optionsStr) {
          const options = optionsStr
            .split(",")
            .map((o: string) => o.trim())
            .filter(Boolean);
          if (options.length > 0) {
            modifiers.push({
              itemId: id,
              name: { en: name.trim() },
              options,
            });
          }
        }
      }

      if (modifiers.length > 0) {
        await prisma.modifier.createMany({ data: modifiers });
      }

      return NextResponse.json(item);
    }

    // ... rest same
  } catch (error: any) {
    console.error("Update item error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
