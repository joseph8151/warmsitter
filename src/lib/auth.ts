import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";

// -----------------------------------------------------------------------------
// Demo auth stub.
//
// This project focuses on the hybrid revenue model, not authentication. Swap
// this out for NextAuth / Clerk / your own session layer. The rest of the app
// only depends on `getCurrentUser()` / `requireUser()`.
//
// Resolution order:
//   1. `ws_uid` cookie (set by the demo login page)
//   2. DEV_USER_ID env var
// -----------------------------------------------------------------------------

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const uid = cookieStore.get("ws_uid")?.value ?? process.env.DEV_USER_ID;
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Not authenticated");
  }
  return user;
}

export async function requireRole(
  roles: User["role"][]
): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
