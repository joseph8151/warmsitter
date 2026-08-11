import { prisma } from "./prisma";

// True if either user has blocked the other (blocks cut interaction both ways).
export async function areBlocked(userA: string, userB: string): Promise<boolean> {
  const hit = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
    select: { id: true },
  });
  return Boolean(hit);
}

// Set of user ids the given user should not see / interact with: everyone they
// blocked, plus everyone who blocked them. Used to filter search results.
export async function blockedUserIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const r of rows) {
    ids.add(r.blockerId === userId ? r.blockedId : r.blockerId);
  }
  return ids;
}
