/* eslint-disable @typescript-eslint/no-unused-vars */
// lib/qr.ts
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

export async function generateQRToken(payload: {
  venueId: string;
  branchId: string;
  tableId: string;
  version: number;
}) {
  // Fetch venue with reseller secret
  const venue = await prisma.venue.findUnique({
    where: { id: payload.venueId },
    select: {
      resellerId: true,
      reseller: {
        select: { qrSigningSecret: true },
      },
    },
  });

  if (!venue) {
    throw new Error("Venue not found");
  }

  const secret =
    venue.reseller?.qrSigningSecret || "dev-secret-change-in-production";

  // Include resellerId in payload (null if no reseller)
  const fullPayload = {
    resellerId: venue.resellerId || null,
    venueId: payload.venueId,
    branchId: payload.branchId,
    tableId: payload.tableId,
    version: payload.version,
  };

  return jwt.sign(fullPayload, secret, { expiresIn: "365d" });
}

export function verifyQRToken(token: string, secret: string) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}
