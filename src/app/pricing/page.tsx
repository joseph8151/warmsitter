import { getSettings } from "@/lib/settings";
import { won } from "@/lib/format";
import { PricingCta } from "@/components/PricingCta";
import { format, getDictionary, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const s = await getSettings();
  const t = getDictionary(getLocale()).pricing;

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">{t.title}</h1>
        <p className="mt-2 text-slate-600">{t.subtitle}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {/* Credits */}
        <div className="ws-card p-6">
          <p className="text-sm font-semibold text-sky-600">{t.payg}</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">{t.credits}</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {s.creditPackages.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.label}</span>
                <span className="font-semibold text-slate-900">{won(p.price)}</span>
              </li>
            ))}
          </ul>
          <PricingCta tab="credit" className="ws-btn-ghost mt-6 w-full" label={t.buyCredits} />
        </div>

        {/* Ticket — highlighted */}
        <div className="ws-card border-2 border-sky-400 p-6">
          <p className="ws-badge bg-sky-500 text-white">{t.popular}</p>
          <h2 className="mt-2 text-xl font-extrabold text-slate-900">
            {format(t.pass, { days: s.ticketDurationDays })}
          </h2>
          <p className="mt-2 text-4xl font-extrabold text-sky-600">{won(s.ticketPrice)}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>{t.passFeat1}</li>
            <li>{t.passFeat2}</li>
            <li>{format(t.passFeat3, { days: s.ticketDurationDays })}</li>
          </ul>
          <PricingCta tab="ticket" className="ws-btn-primary mt-6 w-full" label={t.buyPass} />
        </div>

        {/* Premium */}
        <div className="ws-card p-6">
          <p className="text-sm font-semibold text-sunny-500">{t.premium}</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">{t.membership}</h2>
          <p className="mt-2 text-4xl font-extrabold text-sky-600">
            {won(s.premiumMonthlyPrice)}
            <span className="text-base font-medium text-slate-400"> {t.perMonth}</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>{t.premiumFeat1}</li>
            <li>{t.premiumFeat2}</li>
            <li>{t.premiumFeat3}</li>
          </ul>
          <PricingCta tab="premium" className="ws-btn-accent mt-6 w-full" label={t.startPremium} />
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        {format(t.feeNote, { pct: s.feeRateBps / 100 })}
      </p>
    </div>
  );
}
