import { requireUser } from "@/lib/auth";
import { handleError, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { newOrderId } from "@/lib/toss";

export async function POST() {
  try {
    const user = await requireUser();
    const settings = await getSettings();

    const orderId = newOrderId("ticket");
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        purpose: "TICKET",
        status: "PENDING",
        orderId,
        amount: settings.ticketPrice,
      },
    });

    return json({
      paymentId: payment.id,
      orderId,
      amount: settings.ticketPrice,
      orderName: `warm sitter · ${settings.ticketDurationDays}일 이용권`,
      customerName: user.name,
      clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "",
    });
  } catch (err) {
    return handleError(err);
  }
}
