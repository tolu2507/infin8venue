// app/api/qr/generate/route.ts
import { prisma } from "@/lib/db";
import { generateQRToken } from "@/lib/qr";
import QRCode from "qrcode";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { tableId } = body;

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: {
      branch: {
        include: {
          venue: true,
        },
      },
    },
  });

  if (!table) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  const payload = {
    venueId: table.branch.venueId,
    branchId: table.branchId,
    tableId: table.id,
    version: table.qrVersion,
  };

  const token = await generateQRToken(payload);
  const menuUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/menu?t=${token}`;
  const dataUrl = await QRCode.toDataURL(menuUrl, {
    width: 400,
    margin: 3,
  });

  return NextResponse.json({ url: menuUrl, dataUrl });
}
