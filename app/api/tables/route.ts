// app/api/tables/route.ts
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { branchId, number, area } = body;

  const existing = await prisma.table.findUnique({
    where: { branchId_number: { branchId, number } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Table number already exists" },
      { status: 400 }
    );
  }

  const table = await prisma.table.create({
    data: {
      branchId,
      number,
      area: area || null,
    },
  });

  return NextResponse.json(table);
}
