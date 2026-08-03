import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";
import { isSupabaseAuthEnabled } from "./supabase/config";
import { createSupabaseServerClient } from "./supabase/server";

// -----------------------------------------------------------------------------
// Auth resolution.
//
// When Supabase is configured (NEXT_PUBLIC_SUPABASE_URL + ANON_KEY), the current
// user is derived from the Supabase Auth session, and the matching Prisma `User`
// row is provisioned just-in-time (linked by authId, then by email so seeded
// users attach on first login).
//
// When Supabase is NOT configured, we fall back to the demo stub: a `ws_uid`
// cookie (set by the demo login page) or the DEV_USER_ID env var. This keeps the
// app runnable locally without any Supabase project.
// -----------------------------------------------------------------------------

export async function getCurrentUser(): Promise<User | null> {
  if (isSupabaseAuthEnabled) {
    const supabaseUser = await getUserFromSupabase();
    if (supabaseUser) return supabaseUser;
    // Fall through to the demo cookie too, so demo logins still work in dev.
  }
  return getUserFromDemoCookie();
}

async function getUserFromSupabase(): Promise<User | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const email = authUser.email ?? `${authUser.id}@users.warmsitter`;
  const name =
    (authUser.user_metadata?.name as string | undefined) ??
    email.split("@")[0];
  const desiredRole =
    (authUser.user_metadata?.role as User["role"] | undefined) ?? "PARENT";

  // 1) Already linked by Supabase auth id.
  const byAuthId = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (byAuthId) return byAuthId;

  // 2) Existing (e.g. seeded) user with the same email — link it.
  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { authId: authUser.id },
    });
  }

  // 3) First-time login — provision a new user (+ role-appropriate profile).
  return prisma.user.create({
    data: {
      authId: authUser.id,
      email,
      name,
      role: desiredRole,
      ...(desiredRole === "SITTER"
        ? { sitterProfile: { create: {} } }
        : desiredRole === "PARENT"
        ? { parentProfile: { create: {} } }
        : {}),
    },
  });
}

async function getUserFromDemoCookie(): Promise<User | null> {
  const uid = cookies().get("ws_uid")?.value ?? process.env.DEV_USER_ID;
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not authenticated");
  return user;
}

export async function requireRole(roles: User["role"][]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new AuthError("Forbidden", 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
