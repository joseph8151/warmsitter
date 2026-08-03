import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid items-center gap-8 pt-6 md:grid-cols-2">
        <div>
          <span className="ws-badge bg-sky-100 text-sky-700">☀️ Trusted local babysitters</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
            Warm, reliable care —
            <br />
            <span className="text-sky-600">matched with heart.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate-600">
            Search sitters for free. You only pay when you reach out, interview, or
            start chatting — or go unlimited with a 30-day pass.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/sitters" className="ws-btn-primary">
              Find a sitter
            </Link>
            <Link href="/pricing" className="ws-btn-ghost">
              See pricing
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-6 text-sm text-slate-500">
            <span>✅ Background-checked</span>
            <span>⭐ 4.9 avg rating</span>
            <span>🔒 Secure payments</span>
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
        <h2 className="text-center text-2xl font-extrabold text-slate-900">How warm sitter works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { n: "1", t: "Search for free", d: "Browse background-checked sitters near you. No cost to look." },
            { n: "2", t: "Connect with credits", d: "Spend a credit or ticket to propose an interview, accept, or chat." },
            { n: "3", t: "Book & pay safely", d: "Confirm hours & rate in chat, then pay securely. The sitter gets paid automatically." },
          ].map((c) => (
            <div key={c.n} className="ws-card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-sky-500 font-bold text-white">
                {c.n}
              </div>
              <p className="mt-3 text-lg font-bold text-slate-900">{c.t}</p>
              <p className="mt-1 text-slate-600">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="ws-card overflow-hidden">
        <div className="grid gap-6 p-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-sky-600">Pay as you go</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">Credits</p>
            <p className="mt-2 text-slate-600">Buy small packs and spend only when you connect.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-sky-600">Most popular</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">30-day pass</p>
            <p className="mt-2 text-slate-600">Unlimited proposals, accepts & chats for 30 days.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-sunny-500">Premium</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">Membership</p>
            <p className="mt-2 text-slate-600">Unlimited everything + priority badge & perks.</p>
          </div>
        </div>
        <div className="bg-sky-50 px-8 py-4 text-center">
          <Link href="/pricing" className="ws-btn-primary">
            View all plans
          </Link>
        </div>
      </section>
    </div>
  );
}
