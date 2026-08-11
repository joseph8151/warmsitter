import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";
import { InsufficientCreditError } from "./billing";
import { TossError } from "./toss";
import { UploadError } from "./storage";
import { RateLimitError } from "./security";

export function json<T>(data: T, init?: number | ResponseInit) {
  const responseInit = typeof init === "number" ? { status: init } : init;
  return NextResponse.json(data, responseInit);
}

// Map thrown errors to consistent HTTP responses. The 402 for insufficient
// credit is what the frontend keys on to open the purchase modal.
export function handleError(err: unknown) {
  if (err instanceof InsufficientCreditError) {
    return json(
      {
        error: "INSUFFICIENT_CREDIT",
        message: "이용권이 부족합니다",
        cost: err.cost,
        balance: err.balance,
      },
      402
    );
  }
  if (err instanceof AuthError) {
    return json({ error: "UNAUTHORIZED", message: err.message }, err.status);
  }
  if (err instanceof ZodError) {
    return json({ error: "VALIDATION", issues: err.issues }, 422);
  }
  if (err instanceof TossError) {
    return json({ error: "PAYMENT_ERROR", code: err.code, message: err.message }, 400);
  }
  if (err instanceof UploadError) {
    return json({ error: "UPLOAD_ERROR", message: err.message }, err.status);
  }
  if (err instanceof RateLimitError) {
    return json(
      { error: "RATE_LIMITED", message: err.message },
      { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } }
    );
  }
  // eslint-disable-next-line no-console
  console.error("[api] unhandled error", err);
  return json({ error: "INTERNAL", message: "Something went wrong" }, 500);
}
