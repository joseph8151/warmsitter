import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SitterCard } from "@/components/SitterCard";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

// A parent's saved sitters.
export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center">
        <p className="text-slate-600">로그인이 필요합니다.</p>
        <Link href="/login" className="ws-btn-primary mt-4 inline-flex">로그인</Link>
      </div>
    );
  }
  if (user.role !== "PARENT") {
    return (
      <div className="ws-card mx-auto max-w-md p-10 text-center text-slate-600">
        찜 목록은 부모 계정에서 이용할 수 있어요.
      </div>
    );
  }

  const favorites = await prisma.favorite.findMany({
    where: { parentId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      sitter: {
        select: {
          id: true,
          name: true,
          isPremium: true,
          sitterProfile: true,
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900">찜한 시터</h1>
      <p className="mt-1 text-slate-600">마음에 든 시터를 저장해두고 빠르게 연결하세요.</p>

      {favorites.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="💙"
            title="아직 찜한 시터가 없어요"
            description="마음에 드는 시터의 하트를 눌러 저장해두면 여기 모여요."
            cta={{ href: "/sitters", label: "시터 찾기" }}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites
            .filter((f) => f.sitter.sitterProfile)
            .map((f) => {
              const p = f.sitter.sitterProfile!;
              return (
                <SitterCard
                  key={f.id}
                  favorited
                  sitter={{
                    id: f.sitter.id,
                    name: f.sitter.name,
                    bio: p.bio ?? "",
                    hourlyRate: p.hourlyRate,
                    city: p.city ?? "",
                    yearsOfExp: p.yearsOfExp,
                    photoUrl: p.photoUrl,
                    verified: p.verified,
                    ratingAvg: p.ratingAvg,
                    ratingCount: p.ratingCount,
                    isPremium: f.sitter.isPremium,
                  }}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}
