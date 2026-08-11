import { requireUser } from "@/lib/auth";
import { handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { settlementsToCsv } from "@/lib/receipts";

export const dynamic = "force-dynamic";

// Download the sitter's settlement (earnings) history as CSV.
export async function GET() {
  try {
    const user = await requireUser();
    const settlements = await prisma.settlement.findMany({
      where: { sitterId: user.id },
      orderBy: { createdAt: "desc" },
      take: 1000,
      include: { job: { select: { title: true } } },
    });

    const csv = settlementsToCsv(
      settlements.map((s) => ({
        createdAt: s.createdAt,
        jobTitle: s.job?.title ?? null,
        grossAmount: s.grossAmount,
        platformFee: s.platformFee,
        netAmount: s.netAmount,
        status: s.status,
      }))
    );

    return new Response("﻿" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="warmsitter-earnings.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
