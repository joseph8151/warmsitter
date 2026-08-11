import { requireUser, AuthError } from "@/lib/auth";
import { handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { paymentsToCsv } from "@/lib/receipts";

export const dynamic = "force-dynamic";

// Download the current user's payment history as a CSV file.
export async function GET() {
  try {
    const user = await requireUser();
    const payments = await prisma.payment.findMany({
      where: { userId: user.id, status: { in: ["PAID", "REFUNDED"] } },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const csv = paymentsToCsv(payments);
    // Prefix a UTF-8 BOM so Excel opens Korean text correctly.
    const body = "﻿" + csv;

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="warmsitter-receipts.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return handleError(err);
    return handleError(err);
  }
}
