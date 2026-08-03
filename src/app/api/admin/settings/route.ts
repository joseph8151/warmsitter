import { requireRole } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSettings, normalize } from "@/lib/settings";
import { adminSettingsSchema } from "@/lib/schemas";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET current settings (admin view — full detail).
export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const s = await getSettings();
    return json(s);
  } catch (err) {
    return handleError(err);
  }
}

// Admin updates fee rate, ticket price, credit packages, action costs, etc.
export async function PUT(req: Request) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const patch = adminSettingsSchema.parse(await req.json());

    // Ensure the singleton exists and merge action costs.
    const current = await getSettings();
    const data: Prisma.PlatformSettingUpdateInput = { updatedBy: admin.id };

    if (patch.feeRateBps != null) data.feeRateBps = patch.feeRateBps;
    if (patch.ticketPrice != null) data.ticketPrice = patch.ticketPrice;
    if (patch.ticketDurationDays != null) data.ticketDurationDays = patch.ticketDurationDays;
    if (patch.premiumMonthlyPrice != null) data.premiumMonthlyPrice = patch.premiumMonthlyPrice;
    if (patch.creditPackages) data.creditPackages = patch.creditPackages as unknown as object;
    if (patch.actionCosts) {
      data.actionCosts = {
        ...current.actionCosts,
        ...patch.actionCosts,
      } as unknown as object;
    }

    const row = await prisma.platformSetting.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        feeRateBps: patch.feeRateBps ?? current.feeRateBps,
        ticketPrice: patch.ticketPrice ?? current.ticketPrice,
        ticketDurationDays: patch.ticketDurationDays ?? current.ticketDurationDays,
        premiumMonthlyPrice: patch.premiumMonthlyPrice ?? current.premiumMonthlyPrice,
        creditPackages: (patch.creditPackages ?? current.creditPackages) as unknown as object,
        actionCosts: { ...current.actionCosts, ...(patch.actionCosts ?? {}) } as unknown as object,
        updatedBy: admin.id,
      },
      update: data,
    });

    return json(normalize(row));
  } catch (err) {
    return handleError(err);
  }
}
