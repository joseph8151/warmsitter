import Link from "next/link";
import { getDictionary, getLocale } from "@/lib/i18n";

export default function HomePage() {
  const t = getDictionary(getLocale()).home;

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid items-center gap-8 pt-6 md:grid-cols-2">
        <div>
          <span className="ws-badge bg-sky-100 text-sky-700">{t.badge}</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
            {t.heroLine1}
            <br />
            <span className="text-sky-600">{t.heroLine2}</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate-600">{t.heroSubtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/sitters" className="ws-btn-primary">
              {t.findCta}
            </Link>
            <Link href="/pricing" className="ws-btn-ghost">
              {t.pricingCta}
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-6 text-sm text-slate-500">
            <span>{t.trust1}</span>
            <span>{t.trust2}</span>
            <span>{t.trust3}</span>
          </div>
        </div>

        <div className="relative">
          <div className="ws-card grid grid-cols-2 gap-4 p-6">
            {[
              { name: "Emma R.", rate: "₩18,000/hr", tag: "CPR certified", emoji: "👩‍🍼" },
              { name: "Sofia L.", rate: "₩15,000/hr", tag: "Toddler pro", emoji: "🧸" },
              { name: "Grace K.", rate: "₩20,000/hr", tag: "Newborn care", emoji: "🍼" },
              { name: "Mia T.", rate: "₩16,000/hr", tag: "After school", emoji: "🎒" },
            ].map((s) => (
              <div key={s.name} className="rounded-xl bg-sky-50 p-4">
                <div className="text-3xl">{s.emoji}</div>
                <p className="mt-2 font-bold text-slate-900">{s.name}</p>
                <p className="text-sm text-sky-600">{s.rate}</p>
                <span className="ws-badge mt-2 bg-white text-slate-600">{s.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-center text-2xl font-extrabold text-slate-900">{t.howTitle}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { n: "1", title: t.step1Title, desc: t.step1Desc },
            { n: "2", title: t.step2Title, desc: t.step2Desc },
            { n: "3", title: t.step3Title, desc: t.step3Desc },
          ].map((c) => (
            <div key={c.n} className="ws-card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-sky-500 font-bold text-white">
                {c.n}
              </div>
              <p className="mt-3 text-lg font-bold text-slate-900">{c.title}</p>
              <p className="mt-1 text-slate-600">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="ws-card overflow-hidden">
        <div className="grid gap-6 p-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-sky-600">{t.teaserCreditsKicker}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{t.teaserCredits}</p>
            <p className="mt-2 text-slate-600">{t.teaserCreditsDesc}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-sky-600">{t.teaserPassKicker}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{t.teaserPass}</p>
            <p className="mt-2 text-slate-600">{t.teaserPassDesc}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-sunny-500">{t.teaserPremiumKicker}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{t.teaserPremium}</p>
            <p className="mt-2 text-slate-600">{t.teaserPremiumDesc}</p>
          </div>
        </div>
        <div className="bg-sky-50 px-8 py-4 text-center">
          <Link href="/pricing" className="ws-btn-primary">
            {t.viewPlans}
          </Link>
        </div>
      </section>

      {/* Become a sitter (free) */}
      <section className="ws-card flex flex-col items-center gap-4 bg-gradient-to-r from-sky-500 to-sky-400 p-8 text-center text-white md:flex-row md:justify-between md:text-left">
        <div>
          <p className="text-sm font-semibold text-sky-50">{t.sitterCtaKicker}</p>
          <h2 className="mt-1 text-2xl font-extrabold">{t.sitterCtaTitle}</h2>
          <p className="mt-1 max-w-xl text-sky-50">{t.sitterCtaDesc}</p>
        </div>
        <Link
          href="/login?as=sitter"
          className="shrink-0 rounded-full bg-white px-6 py-3 font-bold text-sky-600 shadow-card hover:bg-sky-50"
        >
          {t.sitterCtaButton}
        </Link>
      </section>
    </div>
  );
}
