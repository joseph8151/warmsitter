"use client";

// Lightweight loader for the Toss Payments browser SDK (v1 widget).
// Docs: https://docs.tosspayments.com/reference/js-sdk

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance;
  }
}

interface TossPaymentsInstance {
  requestPayment(
    method: "카드" | "CARD" | string,
    options: {
      amount: number;
      orderId: string;
      orderName: string;
      customerName?: string;
      successUrl: string;
      failUrl: string;
    }
  ): Promise<void>;
}

let loaderPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.TossPayments) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v1/payment";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Toss Payments SDK"));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

export interface CheckoutParams {
  clientKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerName?: string;
}

// Open the Toss payment window. On success the browser is redirected to
// /api/payments/confirm which captures the payment and fulfills it.
export async function openTossCheckout(params: CheckoutParams): Promise<void> {
  await loadScript();
  if (!window.TossPayments) throw new Error("Toss SDK unavailable");

  const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  const toss = window.TossPayments(params.clientKey);

  await toss.requestPayment("CARD", {
    amount: params.amount,
    orderId: params.orderId,
    orderName: params.orderName,
    customerName: params.customerName,
    successUrl: `${base}/api/payments/confirm`,
    failUrl: `${base}/billing/result?status=fail`,
  });
}
