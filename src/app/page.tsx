import Link from "next/link";
import { getDictionary, getLocale } from "@/lib/i18n";
import { HeroArt } from "@/components/brand/HeroArt";
import { Avatar } from "@/components/brand/Avatar";
import {
  SearchIcon,
  ChatIcon,
  WalletIcon,
  ShieldCheckIcon,
  LockIcon,
  StarIcon,
  HeartIcon,
  BadgeCheckIcon,
  ArrowRightIcon,
  SparkleIcon,
} from "@/components/brand/Icons";

export default function HomePage() {
  const t = getDictionary(getLocale()).home;

  const stats = [
    { v: t.stat1Value, l: t.stat1Label },
    { v: t.stat2Value, l: t.stat2Label },
    { v: t.stat3Value, l: t.stat3Label },
    { v: t.stat4Value, l: t.stat4Label },
  ];

  const steps = [
    { n: "1", Icon: SearchIcon, title: t.step1Title, desc: t.step1Desc },
    { n: "2", Icon: ChatIcon, title: t.step2Title, desc: t.step2Desc },
    { n: "3", Icon: WalletIcon, title: t.step3Title, desc: t.step3Desc },
  ];

  const safety = [
    { Icon: ShieldCheckIcon, title: t.safety1Title, desc: t.safety1Desc },
    { Icon: LockIcon, title: t.safety2Title, desc: t.safety2Desc },
    { Icon: StarIcon, title: t.safety3Title, desc: t.safety3Desc },
    { Icon: HeartIcon, title: t.safety4Title, desc: t.safety4Desc },
  ];

  const featured = [
    { name: "Emma R.", rate: "₩18,000", city: "Seoul", tag: "CPR 자격", rating: "4.9", verified: true },
    { name: "Sofia L.", rate: "₩15,000", city: "Seongnam", tag: "유아 전문", rating: "4.8", verified: true },
    { name: "Grace K.", rate: "₩20,000", city: "Seoul", tag: "신생아 케어", rating: "5.0", verified: true },
    { name: "Mia T.", rate: "₩16,000", city: "Bucheon", tag: "방과후", rating: "4.7", verified: false },
  ];

  const testimonials = [
    { quote: t.testi1, by: t.testi1By },
    { quote: t.testi2, by: t.testi2By },
    { quote: t.testi3, by: t.testi3By },
  ];

  return (
    <div className="space-y-24 pb-8">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative grid items-center gap-10 pt-4 md:grid-cols-2">
        {/* soft decorative glow */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full bg-sunny-300/25 blur-3xl" />

        <div className="ws-animate relative">
          <span className="ws-chip">
            <SparkleIcon className="h-4 w-4 text-sunny-500" />
            {t.badge}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink-900 md:text-6xl">
            {t.heroLine1}
            <br />
            <span className="ws-gradient-text">{t.heroLine2}</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-600">{t.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sitters" className="ws-btn-primary text-base">
              {t.findCta}
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link href="/login?as=sitter" className="ws-btn-ghost text-base">
              {t.sitterCtaButton}
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5"><ShieldCheckIcon className="h-4 w-4 text-sky-500" />{t.trust1}</span>
            <span className="inline-flex items-center gap-1.5"><StarIcon className="h-4 w-4 text-sunny-500" />{t.trust2}</span>
            <span className="inline-flex items-center gap-1.5"><LockIcon className="h-4 w-4 text-sky-500" />{t.trust3}</span>
          </div>
        </div>

        <div className="relative">
          <HeroArt />
        </div>
      </section>

      {/* ---------------------------------------------------- Promise ribbon */}
      <section className="-mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-semibold text-slate-500">
        {[t.promise1, t.promise2, t.promise3, t.promise4].map((p, i) => (
          <span key={p} className="inline-flex items-center gap-3">
            {i > 0 && <span className="h-1 w-1 rounded-full bg-sky-300" />}
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheckIcon className="h-4 w-4 text-sky-500" />
              {p}
            </span>
          </span>
        ))}
      </section>

      {/* --------------------------------------------------------------- Stats */}
      <section className="ws-card ws-dots overflow-hidden p-8">
        <p className="text-center text-sm font-semibold text-slate-500">{t.statImpact}</p>
        <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-3xl font-extrabold text-ink-900 md:text-4xl">
                <span className="ws-gradient-text">{s.v}</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- How it works */}
      <section>
        <div className="text-center">
          <span className="ws-eyebrow">how it works</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900">{t.howTitle}</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(({ n, Icon, title, desc }) => (
            <div key={n} className="ws-card ws-card-hover relative p-7">
              <span className="absolute right-6 top-5 text-5xl font-black text-sky-50">{n}</span>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-ring">
                <Icon className="h-6 w-6" />
              </div>
              <p className="mt-5 text-lg font-bold text-ink-900">{title}</p>
              <p className="mt-2 leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- Safety */}
      <section className="relative overflow-hidden rounded-xl4 bg-ink-900 p-8 text-white md:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-sunny-500/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="ws-eyebrow text-sky-300">{t.safetyKicker}</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">{t.safetyTitle}</h2>
          <p className="mt-3 text-slate-300">{t.safetySubtitle}</p>
        </div>
        <div className="relative mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {safety.map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-500/90 text-white">
                <Icon className="h-6 w-6" />
              </div>
              <p className="mt-4 font-bold">{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- Featured sitters */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="ws-eyebrow">{t.featuredKicker}</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900">{t.featuredTitle}</h2>
            <p className="mt-2 text-slate-600">{t.featuredSubtitle}</p>
          </div>
          <Link href="/sitters" className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 sm:inline-flex">
            {t.featuredCta}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((s) => (
            <Link key={s.name} href="/sitters" className="ws-card ws-card-hover group block p-5">
              <div className="flex items-center gap-3">
                <Avatar name={s.name} className="h-14 w-14" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-bold text-ink-900">
                    {s.name}
                    {s.verified && <BadgeCheckIcon className="h-4 w-4 text-sky-500" />}
                  </p>
                  <p className="truncate text-sm text-slate-500">{s.city}</p>
                </div>
              </div>
              <span className="ws-badge mt-4 bg-sky-50 text-sky-700">{s.tag}</span>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="font-extrabold text-sky-600">
                  {s.rate}
                  <span className="text-sm font-medium text-slate-400">/시간</span>
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-sunny-600">
                  <StarIcon className="h-4 w-4" />
                  {s.rating}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- Testimonials */}
      <section>
        <div className="text-center">
          <span className="ws-eyebrow">{t.testiKicker}</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900">{t.testiTitle}</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((q) => (
            <figure key={q.by} className="ws-card flex flex-col p-7">
              <div className="text-sunny-400" aria-hidden="true">
                {"★★★★★"}
              </div>
              <blockquote className="mt-3 flex-1 leading-relaxed text-slate-700">“{q.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                <Avatar name={q.by} className="h-9 w-9" />
                <span className="text-sm font-semibold text-slate-600">{q.by}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- Pricing teaser */}
      <section className="ws-card overflow-hidden">
        <div className="grid gap-6 p-8 md:grid-cols-3">
          {[
            { k: t.teaserCreditsKicker, title: t.teaserCredits, desc: t.teaserCreditsDesc, accent: "text-sky-600" },
            { k: t.teaserPassKicker, title: t.teaserPass, desc: t.teaserPassDesc, accent: "text-sky-600" },
            { k: t.teaserPremiumKicker, title: t.teaserPremium, desc: t.teaserPremiumDesc, accent: "text-sunny-600" },
          ].map((c) => (
            <div key={c.title}>
              <p className={`text-sm font-semibold ${c.accent}`}>{c.k}</p>
              <p className="mt-1 text-2xl font-extrabold text-ink-900">{c.title}</p>
              <p className="mt-2 text-slate-600">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-r from-sky-50 to-white px-8 py-5 text-center">
          <Link href="/pricing" className="ws-btn-primary">
            {t.viewPlans}
          </Link>
        </div>
      </section>

      {/* -------------------------------------------------- Become a sitter */}
      <section className="relative overflow-hidden rounded-xl4 bg-gradient-to-br from-sky-500 via-sky-500 to-sky-600 p-8 text-white shadow-glow md:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-50">{t.sitterCtaKicker}</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight">{t.sitterCtaTitle}</h2>
            <p className="mt-2 max-w-xl text-sky-50/90">{t.sitterCtaDesc}</p>
          </div>
          <Link
            href="/login?as=sitter"
            className="shrink-0 rounded-full bg-white px-7 py-3.5 font-bold text-sky-600 shadow-lift transition hover:-translate-y-0.5 hover:bg-sky-50"
          >
            {t.sitterCtaButton}
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------------- FAQ teaser */}
      <section className="relative overflow-hidden rounded-xl4 border border-slate-100 bg-gradient-to-br from-white to-sky-50 p-8 md:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="relative flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-sky-600 shadow-soft">
              <SparkleIcon className="h-6 w-6" />
            </span>
            <div>
              <span className="ws-eyebrow">{t.faqKicker}</span>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900">{t.faqTitle}</h2>
              <p className="mt-1 max-w-md text-slate-600">{t.faqDesc}</p>
            </div>
          </div>
          <Link href="/faq" className="ws-btn-ghost shrink-0">
            {t.faqCta}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* -------------------------------------------------------- Final CTA */}
      <section className="relative text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sunny-300/20 blur-3xl" />
        <h2 className="relative text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">{t.finalTitle}</h2>
        <p className="relative mx-auto mt-3 max-w-md text-slate-600">{t.finalDesc}</p>
        <div className="relative mt-7 flex justify-center gap-3">
          <Link href="/sitters" className="ws-btn-primary text-base">
            {t.findCta}
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
          <Link href="/pricing" className="ws-btn-ghost text-base">
            {t.pricingCta}
          </Link>
        </div>
      </section>
    </div>
  );
}
