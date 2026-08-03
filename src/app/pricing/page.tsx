import { getSettings } from "@/lib/settings";
import { won } from "@/lib/format";
import { PricingCta } from "@/components/PricingCta";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const s = await getSettings();

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Simple, fair pricing</h1>
        <p className="mt-2 text-slate-600">
          Free to search. Pay only when you connect — or go unlimited.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {/* Credits */}
        <div className="ws-card p-6">
          <p className="text-sm font-semibold text-sky-600">Pay as you go</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">Credits</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {s.creditPackages.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.label}</span>
                <span className="font-semibold text-slate-900">{won(p.price)}</span>
              </li>
            ))}
          </ul>
          <PricingCta tab="credit" className="ws-btn-ghost mt-6 w-full" label="크레딧 구매" />
        </div>

        {/* Ticket — highlighted */}
        <div className="ws-card border-2 border-sky-400 p-6">
          <p className="ws-badge bg-sky-500 text-white">MOST POPULAR</p>
          <h2 className="mt-2 text-xl font-extrabold text-slate-900">
            {s.ticketDurationDays}-day pass
          </h2>
          <p className="mt-2 text-4xl font-extrabold text-sky-600">{won(s.ticketPrice)}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>✅ Unlimited interview proposals</li>
            <li>✅ Unlimited accepts & chats</li>
            <li>✅ No per-action deduction for {s.ticketDurationDays} days</li>
          </ul>
          <PricingCta tab="ticket" className="ws-btn-primary mt-6 w-full" label="이용권 구매" />
        </div>

        {/* Premium */}
        <div className="ws-card p-6">
          <p className="text-sm font-semibold text-sunny-500">Premium</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">Membership</h2>
          <p className="mt-2 text-4xl font-extrabold text-sky-600">
            {won(s.premiumMonthlyPrice)}
            <span className="text-base font-medium text-slate-400"> /mo</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>✅ Everything unlimited</li>
            <li>⭐ Priority listing badge</li>
            <li>🔔 Early access to new sitters</li>
          </ul>
          <PricingCta tab="premium" className="ws-btn-accent mt-6 w-full" label="프리미엄 시작" />
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        돌봄 확정 후 결제 시 플랫폼 수수료 <b>{s.feeRateBps / 100}%</b>가 적용됩니다.
      </p>
    </div>
  );
}
