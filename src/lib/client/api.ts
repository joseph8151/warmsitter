"use client";

// Thin fetch wrapper. The important bit: a 402 response means the user is out
// of credits/ticket, which the caller uses to open the purchase modal.

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any) {
    super(body?.message ?? body?.error ?? `Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
  get isInsufficientCredit() {
    return this.status === 402 && this.body?.error === "INSUFFICIENT_CREDIT";
  }
}

export async function api<T = any>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}
