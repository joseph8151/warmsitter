import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { addCredits } from "./billing";

// -----------------------------------------------------------------------------
// Referral program ("친구 초대").
//
// Each user has a shareable `referralCode`. When someone lands on the site with
// `?ref=CODE`, middleware drops a `ws_ref` cookie. On that visitor's first sign-
// up, applyReferralForNewUser() links them to the referrer and grants a small
// credit bonus to BOTH sides — once, guarded by `referralAwarded`.
//
// Referrals are best-effort: any failure here must never block sign-in, so the
// caller wraps this in try/catch.
// -----------------------------------------------------------------------------

export const REF_COOKIE = "ws_ref";
// Credits granted to each side when a referral converts.
export const REFERRAL_BONUS = 2;
// Ambiguous characters (0/O, 1/I) are excluded so codes are easy to read aloud.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LEN = 6;

// Normalize a user-supplied code: uppercase, keep only alphabet characters.
export function normalizeCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  return cleaned.length >= 4 ? cleaned : null;
}

function randomCode(): string {
  const bytes = randomBytes(CODE_LEN);
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// Return the user's referral code, generating and persisting one on first use.
// Retries on the (astronomically unlikely) unique-collision.
export async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
      return updated.referralCode!;
    } catch {
      // Unique collision (or a concurrent writer set it) — re-read and retry.
      const again = await prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      });
      if (again?.referralCode) return again.referralCode;
    }
  }
  throw new Error("Could not generate a referral code");
}

// Called once, right after a brand-new user is provisioned. Reads the ws_ref
// cookie, and if it maps to a *different* existing user, links the referral and
// grants REFERRAL_BONUS credits to both sides in a single transaction.
export async function applyReferralForNewUser(newUserId: string): Promise<void> {
  const code = normalizeCode(cookies().get(REF_COOKIE)?.value);
  if (!code) return;

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true },
  });
  if (!referrer || referrer.id === newUserId) return;

  await prisma.$transaction(async (tx) => {
    // Re-check inside the tx that this user hasn't already been awarded/linked.
    const fresh = await tx.user.findUnique({
      where: { id: newUserId },
      select: { referralAwarded: true, referredById: true },
    });
    if (!fresh || fresh.referralAwarded || fresh.referredById) return;

    await tx.user.update({
      where: { id: newUserId },
      data: { referredById: referrer.id, referralAwarded: true },
    });

    await addCredits({
      userId: newUserId,
      amount: REFERRAL_BONUS,
      type: "ADJUSTMENT",
      reason: "친구 초대 가입 보너스",
      tx,
    });
    await addCredits({
      userId: referrer.id,
      amount: REFERRAL_BONUS,
      type: "ADJUSTMENT",
      reason: "친구 초대 보상",
      tx,
    });
  });
}
