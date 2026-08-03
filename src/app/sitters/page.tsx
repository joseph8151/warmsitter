import { prisma } from "@/lib/prisma";
import { SitterCard } from "@/components/SitterCard";

export const dynamic = "force-dynamic";

// Step 1 of the flow: parents search sitters for FREE.
export default async function SittersPage() {
  const sitters = await prisma.sitterProfile.findMany({
    orderBy: [{ verified: "desc" }, { ratingAvg: "desc" }],
    include: { user: { select: { id: true, name: true, isPremium: true } } },
    take: 24,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Find your sitter</h1>
        <p className="mt-1 text-slate-600">
          Searching is free — you only spend a credit/ticket when you propose an
          interview or start a chat. Premium members go unlimited.
        </p>
      </div>

      {sitters.length === 0 ? (
        <div className="ws-card p-10 text-center text-slate-500">
          아직 등록된 시터가 없습니다. <code>npm run db:seed</code> 로 샘플 데이터를 넣어보세요.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sitters.map((s) => (
            <SitterCard
              key={s.id}
              sitter={{
                id: s.user.id,
                name: s.user.name,
                bio: s.bio ?? "",
                hourlyRate: s.hourlyRate,
                city: s.city ?? "",
                yearsOfExp: s.yearsOfExp,
                verified: s.verified,
                ratingAvg: s.ratingAvg,
                ratingCount: s.ratingCount,
                isPremium: s.user.isPremium,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
