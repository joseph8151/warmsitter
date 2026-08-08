import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "자주 묻는 질문 — warm sitter",
  description: "warm sitter 이용 방법, 요금, 결제, 환불, 안전에 대한 안내.",
};

// Static help/FAQ page. Content is inlined per-locale (rather than bloating the
// shared dictionary) since it's long-form and only rendered here.
const CONTENT = {
  ko: {
    title: "자주 묻는 질문",
    subtitle: "warm sitter 이용에 대해 가장 많이 묻는 것들을 모았어요.",
    groups: [
      {
        heading: "시작하기",
        items: [
          {
            q: "가입은 무료인가요?",
            a: "네, 가입은 무료예요. 시터는 등록·프로필·검색 노출까지 모두 무료이고, 부모도 시터 검색과 프로필 열람은 무료로 이용할 수 있어요.",
          },
          {
            q: "시터로 어떻게 등록하나요?",
            a: "홈 화면의 ‘시터로 무료 등록’ 버튼을 누르면 몇 분 만에 가입할 수 있어요. Google·Apple 계정으로도 바로 시작할 수 있고, 가입 후 프로필에서 시급·지역·경력·소개와 가능 시간을 입력하면 검색에 노출돼요.",
          },
          {
            q: "부모와 시터 계정을 둘 다 만들 수 있나요?",
            a: "한 계정은 하나의 역할(부모 또는 시터)로 운영돼요. 두 역할이 모두 필요하면 별도의 이메일로 각각 가입해주세요.",
          },
        ],
      },
      {
        heading: "요금과 결제",
        items: [
          {
            q: "언제 결제가 필요한가요?",
            a: "검색은 항상 무료예요. 부모가 시터에게 면접을 제안하거나 수락·채팅을 시작할 때만 크레딧이 차감되거나 이용권이 필요해요. 시터는 어떤 경우에도 결제하지 않아요.",
          },
          {
            q: "크레딧과 이용권은 무엇이 다른가요?",
            a: "크레딧은 쓴 만큼 차감되는 소량 패키지이고, 30일 이용권은 기간 동안 제안·수락·채팅을 무제한으로 쓸 수 있어요. 자주 이용한다면 이용권이 더 경제적이에요.",
          },
          {
            q: "돌봄 비용은 어떻게 지불되나요?",
            a: "채팅으로 시간과 시급을 확정한 뒤 앱에서 안전하게 결제하면, 플랫폼 수수료를 제외한 금액이 시터에게 자동으로 정산돼요.",
          },
          {
            q: "환불이 되나요?",
            a: "사용하지 않은 크레딧·이용권은 결제 관련 정책에 따라 환불될 수 있어요. 자세한 내용은 고객센터로 문의해주세요.",
          },
        ],
      },
      {
        heading: "안전과 신뢰",
        items: [
          {
            q: "시터의 신원은 어떻게 확인되나요?",
            a: "시터는 프로필에서 신원확인 자료를 제출할 수 있고, 확인이 완료되면 프로필에 인증 배지가 표시돼요. 부모는 ‘인증 시터만’ 필터로 확인된 시터만 볼 수도 있어요.",
          },
          {
            q: "문제가 있는 사용자를 신고할 수 있나요?",
            a: "네. 프로필이나 채팅에서 신고·차단할 수 있어요. 접수된 신고는 운영팀이 검토해 조치해요.",
          },
          {
            q: "후기는 어떻게 작성되나요?",
            a: "돌봄이 완료된 뒤 부모와 시터가 서로 후기를 남길 수 있어요. 실제 거래에 기반한 후기만 반영돼 신뢰도를 높여요.",
          },
        ],
      },
    ],
    ctaTitle: "더 궁금한 점이 있으세요?",
    ctaDesc: "여기서 답을 못 찾으셨다면 언제든 문의해주세요. 최대한 빨리 도와드릴게요.",
    ctaButton: "시터 둘러보기",
  },
  en: {
    title: "Frequently asked questions",
    subtitle: "The things people ask most about using warm sitter.",
    groups: [
      {
        heading: "Getting started",
        items: [
          {
            q: "Is it free to join?",
            a: "Yes. Signing up is free. For sitters, registration, your profile, and search visibility are all free — and parents can search and view sitter profiles for free too.",
          },
          {
            q: "How do I register as a sitter?",
            a: "Tap ‘Become a sitter — free’ on the home page and you can join in a few minutes. You can start with Google or Apple, then add your rate, city, experience, bio and availability in your profile to appear in search.",
          },
          {
            q: "Can I have both a parent and a sitter account?",
            a: "Each account runs as a single role (parent or sitter). If you need both, sign up separately with a different email for each.",
          },
        ],
      },
      {
        heading: "Pricing & payments",
        items: [
          {
            q: "When do I need to pay?",
            a: "Searching is always free. Parents only spend a credit — or use a pass — when they propose an interview, accept, or start a chat. Sitters never pay.",
          },
          {
            q: "What's the difference between credits and a pass?",
            a: "Credits are small packs spent as you go, while a 30-day pass gives unlimited proposals, accepts and chats for the period. A pass is better value if you connect often.",
          },
          {
            q: "How is the care fee paid?",
            a: "After you confirm the hours and rate in chat, you pay securely in the app. The amount, minus the platform fee, is settled to the sitter automatically.",
          },
          {
            q: "Do you offer refunds?",
            a: "Unused credits or passes may be refundable under our payment policy. Contact support for details.",
          },
        ],
      },
      {
        heading: "Safety & trust",
        items: [
          {
            q: "How are sitters verified?",
            a: "Sitters can submit verification documents from their profile, and a verified badge appears once it's confirmed. Parents can also filter to ‘Verified only’.",
          },
          {
            q: "Can I report a problem user?",
            a: "Yes. You can report or block from a profile or chat. Our team reviews every report and takes action.",
          },
          {
            q: "How do reviews work?",
            a: "After care is completed, parents and sitters can review each other. Only reviews based on real bookings count, which keeps ratings trustworthy.",
          },
        ],
      },
    ],
    ctaTitle: "Still have a question?",
    ctaDesc: "If you didn't find your answer here, reach out any time and we'll help as soon as we can.",
    ctaButton: "Browse sitters",
  },
} as const;

export default function FaqPage() {
  const t = CONTENT[getLocale()];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">{t.title}</h1>
        <p className="mt-2 text-slate-600">{t.subtitle}</p>
      </header>

      {t.groups.map((group) => (
        <section key={group.heading} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-sky-600">
            {group.heading}
          </h2>
          <div className="space-y-3">
            {group.items.map((item) => (
              <details key={item.q} className="ws-card group p-5 [&_summary]:cursor-pointer">
                <summary className="flex items-center justify-between gap-3 font-semibold text-slate-900 marker:content-['']">
                  {item.q}
                  <span className="text-sky-400 transition group-open:rotate-180" aria-hidden="true">
                    ▾
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <section className="ws-card bg-gradient-to-b from-sky-50 to-white p-8 text-center">
        <h2 className="text-xl font-extrabold text-slate-900">{t.ctaTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-slate-600">{t.ctaDesc}</p>
        <Link href="/sitters" className="ws-btn-primary mt-5 inline-flex">
          {t.ctaButton}
        </Link>
      </section>
    </div>
  );
}
