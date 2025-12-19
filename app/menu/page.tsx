/* eslint-disable @typescript-eslint/no-explicit-any */
// app/menu/page.tsx
import MenuClient from "./MenuClient";
import { prisma } from "@/lib/db";
import { verifyQRToken } from "@/lib/qr";
import jwt from "jsonwebtoken";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t: token } = await searchParams;

  if (!token) {
    return (
      <div className="text-center py-32 text-red-500 text-2xl">
        Invalid QR Code
      </div>
    );
  }

  let decoded: any = null;
  try {
    decoded = jwt.decode(token);
  } catch {
    return (
      <div className="text-center py-32 text-red-500 text-2xl">
        Invalid Token
      </div>
    );
  }

  if (!decoded?.branchId) {
    return (
      <div className="text-center py-32 text-red-500 text-2xl">
        Invalid QR Code
      </div>
    );
  }

  const branch = await prisma.branch.findUnique({
    where: { id: decoded.branchId },
    include: {
      venue: { include: { reseller: true } },
      categories: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          items: {
            where: { available: true },
            include: { modifiers: true },
          },
        },
      },
    },
  });

  if (!branch) {
    return (
      <div className="text-center py-32 text-red-500 text-2xl">
        Venue Not Found
      </div>
    );
  }

  const secret =
    branch.venue.reseller?.qrSigningSecret || "dev-secret-change-in-production";
  const verified = verifyQRToken(token, secret);

  if (!verified) {
    return (
      <div className="text-center py-32 text-red-500 text-2xl">
        Invalid or Expired QR
      </div>
    );
  }

  // Find open order for this table
  const openOrder = await prisma.order.findFirst({
    where: {
      branchId: decoded.branchId,
      tableId: decoded.tableId,
      status: { not: "CLOSED" },
    },
    include: {
      items: {
        include: { menuItem: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedBranch = {
    ...branch,
    categories: branch.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
    })),
  };

  return (
    <MenuClient
      branch={serializedBranch}
      context={verified}
      openOrder={
        openOrder
          ? {
              id: openOrder.id,
              orderNumber: openOrder.orderNumber,
              subtotal: Number(openOrder.subtotal),
              tax: Number(openOrder.tax),
              total: Number(openOrder.total),
              items: openOrder.items.map((i) => ({
                id: i.menuItem.id,
                name: i.menuItem.name,
                price: Number(i.priceAtOrder),
                qty: i.quantity,
              })),
            }
          : null
      }
    />
  );
}
