// -----------------------------------------------------------------------------
// Toss Payments server client.
//
// Docs: https://docs.tosspayments.com/reference
//
// The browser opens the payment widget with NEXT_PUBLIC_TOSS_CLIENT_KEY and,
// on success, is redirected back with { paymentKey, orderId, amount }. The
// server then calls `confirmPayment` with the secret key to actually capture
// the money. Toss also POSTs status changes to our webhook.
// -----------------------------------------------------------------------------

const TOSS_API = "https://api.tosspayments.com/v1";

function authHeader(): string {
  const secret = process.env.TOSS_SECRET_KEY ?? "";
  // Toss uses HTTP Basic auth: base64("<secretKey>:") — note the trailing colon.
  const token = Buffer.from(`${secret}:`).toString("base64");
  return `Basic ${token}`;
}

export interface TossPayment {
  paymentKey: string;
  orderId: string;
  status:
    | "READY"
    | "IN_PROGRESS"
    | "WAITING_FOR_DEPOSIT"
    | "DONE"
    | "CANCELED"
    | "PARTIAL_CANCELED"
    | "ABORTED"
    | "EXPIRED";
  totalAmount: number;
  method?: string;
  approvedAt?: string;
  [key: string]: unknown;
}

export class TossError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "TossError";
    this.code = code;
    this.status = status;
  }
}

async function tossFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${TOSS_API}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    // Payments must never be cached.
    cache: "no-store",
  });

  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new TossError(
      (data.message as string) ?? "Toss request failed",
      (data.code as string) ?? "UNKNOWN",
      res.status
    );
  }
  return data as T;
}

/**
 * Confirm (capture) a payment after the customer completes the widget.
 * `amount` MUST match the amount we created the order with — Toss rejects
 * mismatches, which protects against client-side tampering.
 */
export function confirmPayment(args: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<TossPayment> {
  return tossFetch<TossPayment>("/payments/confirm", {
    method: "POST",
    body: JSON.stringify(args),
  });
}

/** Fetch a payment by paymentKey (used to reconcile webhooks). */
export function getPayment(paymentKey: string): Promise<TossPayment> {
  return tossFetch<TossPayment>(`/payments/${paymentKey}`, { method: "GET" });
}

/** Cancel (refund) a payment, fully or partially. */
export function cancelPayment(args: {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
}): Promise<TossPayment> {
  const { paymentKey, ...body } = args;
  return tossFetch<TossPayment>(`/payments/${paymentKey}/cancel`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface TossBillingAuth {
  billingKey: string;
  customerKey: string;
  card?: { company?: string; number?: string };
  [key: string]: unknown;
}

/**
 * Exchange the `authKey` from the billing-auth widget for a durable billingKey.
 * POST /v1/billing/authorizations/issue
 */
export function issueBillingKey(args: {
  authKey: string;
  customerKey: string;
}): Promise<TossBillingAuth> {
  return tossFetch<TossBillingAuth>("/billing/authorizations/issue", {
    method: "POST",
    body: JSON.stringify(args),
  });
}

/**
 * Charge a stored billing key (recurring subscription).
 * See https://docs.tosspayments.com/guides/v2/billing/integration
 */
export function chargeBillingKey(args: {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
}): Promise<TossPayment> {
  const { billingKey, ...body } = args;
  return tossFetch<TossPayment>(`/billing/${billingKey}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// A short, unique order id. Kept ASCII + <= 64 chars per Toss constraints.
export function newOrderId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}_${rand}`;
}
