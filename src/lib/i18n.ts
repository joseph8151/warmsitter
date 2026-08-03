import { cookies } from "next/headers";

export type Locale = "ko" | "en";
export const LOCALES: Locale[] = ["ko", "en"];
export const DEFAULT_LOCALE: Locale = "ko";
export const LOCALE_COOKIE = "ws_locale";

// Server-side locale resolution from the ws_locale cookie.
export function getLocale(): Locale {
  const v = cookies().get(LOCALE_COOKIE)?.value;
  return v === "en" || v === "ko" ? v : DEFAULT_LOCALE;
}

const dictionaries = {
  ko: {
    nav: {
      findSitters: "시터 찾기",
      jobs: "구인글",
      pricing: "요금제",
      dashboard: "대시보드",
      chat: "채팅",
      interviews: "면접",
      profile: "프로필",
      admin: "관리자",
      login: "로그인",
      logout: "로그아웃",
    },
    footer: { tagline: "warm sitter · 검색은 무료 — 연결할 때만 결제하세요." },
    home: {
      badge: "☀️ 믿을 수 있는 우리 동네 시터",
      heroLine1: "따뜻하고 든든한 돌봄,",
      heroLine2: "마음으로 매칭해요.",
      heroSubtitle:
        "시터 검색은 무료예요. 면접 제안·수락·채팅을 시작할 때만 결제하거나, 30일 이용권으로 무제한 이용하세요.",
      findCta: "시터 찾기",
      pricingCta: "요금 보기",
      trust1: "✅ 신원 확인",
      trust2: "⭐ 평균 4.9점",
      trust3: "🔒 안전 결제",
      howTitle: "warm sitter 이용 방법",
      step1Title: "무료로 검색",
      step1Desc: "우리 동네 신원 확인된 시터를 무료로 둘러보세요.",
      step2Title: "크레딧으로 연결",
      step2Desc: "크레딧 또는 이용권으로 면접 제안·수락·채팅을 시작하세요.",
      step3Title: "예약 & 안전 결제",
      step3Desc: "채팅으로 시간·시급을 확정하고 안전하게 결제하면 시터에게 자동 정산돼요.",
      teaserCreditsKicker: "쓴 만큼",
      teaserCredits: "크레딧",
      teaserCreditsDesc: "소량 패키지를 구매해 연결할 때만 사용하세요.",
      teaserPassKicker: "가장 인기",
      teaserPass: "30일 이용권",
      teaserPassDesc: "30일간 제안·수락·채팅을 무제한으로.",
      teaserPremiumKicker: "프리미엄",
      teaserPremium: "멤버십",
      teaserPremiumDesc: "무제한 + 우선 노출 뱃지 및 추가 혜택.",
      viewPlans: "모든 요금제 보기",
    },
  },
  en: {
    nav: {
      findSitters: "Find sitters",
      jobs: "Jobs",
      pricing: "Pricing",
      dashboard: "Dashboard",
      chat: "Chat",
      interviews: "Interviews",
      profile: "Profile",
      admin: "Admin",
      login: "Log in",
      logout: "Log out",
    },
    footer: { tagline: "warm sitter · Free to search — pay only when you connect." },
    home: {
      badge: "☀️ Trusted local babysitters",
      heroLine1: "Warm, reliable care —",
      heroLine2: "matched with heart.",
      heroSubtitle:
        "Search sitters for free. You only pay when you reach out, interview, or start chatting — or go unlimited with a 30-day pass.",
      findCta: "Find a sitter",
      pricingCta: "See pricing",
      trust1: "✅ Background-checked",
      trust2: "⭐ 4.9 avg rating",
      trust3: "🔒 Secure payments",
      howTitle: "How warm sitter works",
      step1Title: "Search for free",
      step1Desc: "Browse background-checked sitters near you. No cost to look.",
      step2Title: "Connect with credits",
      step2Desc: "Spend a credit or ticket to propose an interview, accept, or chat.",
      step3Title: "Book & pay safely",
      step3Desc: "Confirm hours & rate in chat, then pay securely. The sitter gets paid automatically.",
      teaserCreditsKicker: "Pay as you go",
      teaserCredits: "Credits",
      teaserCreditsDesc: "Buy small packs and spend only when you connect.",
      teaserPassKicker: "Most popular",
      teaserPass: "30-day pass",
      teaserPassDesc: "Unlimited proposals, accepts & chats for 30 days.",
      teaserPremiumKicker: "Premium",
      teaserPremium: "Membership",
      teaserPremiumDesc: "Unlimited everything + priority badge & perks.",
      viewPlans: "View all plans",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
