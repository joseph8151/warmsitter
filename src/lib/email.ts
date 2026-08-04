import type { NotificationType } from "@prisma/client";

// -----------------------------------------------------------------------------
// Transactional email via Resend's REST API (no SDK dependency). Feature-flagged
// on RESEND_API_KEY + EMAIL_FROM; a no-op when unconfigured. Best-effort: never
// throws to the caller.
// -----------------------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

export const isEmailEnabled = Boolean(RESEND_API_KEY && EMAIL_FROM);

// Notification types worth an email. High-frequency ones (chat messages) are
// intentionally excluded to avoid inbox spam.
const EMAILABLE: ReadonlySet<NotificationType> = new Set<NotificationType>([
  "APPLICATION_RECEIVED",
  "APPLICATION_ACCEPTED",
  "INTERVIEW_PROPOSED",
  "INTERVIEW_RESPONSE",
  "SETTLEMENT_PAID",
  "VERIFICATION_RESULT",
  "TICKET_EXPIRING",
  "SYSTEM",
]);

export function shouldEmail(type: NotificationType): boolean {
  return isEmailEnabled && EMAILABLE.has(type);
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  if (!isEmailEnabled) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error("[email] send failed", res.status);
      return false;
    }
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[email] error", err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Simple branded HTML for a notification email.
export function notificationEmailHtml(args: { title: string; body?: string; link?: string }): string {
  const url = args.link ? `${BASE_URL}${args.link}` : BASE_URL || "#";
  const cta = args.link
    ? `<a href="${escapeHtml(url)}" style="display:inline-block;margin-top:16px;background:#0ea5e9;color:#fff;text-decoration:none;padding:10px 22px;border-radius:999px;font-weight:600">열어보기</a>`
    : "";
  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:#f0f9ff;padding:24px">
    <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e0f2fe;border-radius:16px;padding:28px">
      <div style="font-size:22px">☀️ <b style="color:#0369a1">warm sitter</b></div>
      <h1 style="font-size:18px;color:#0f172a;margin:16px 0 6px">${escapeHtml(args.title)}</h1>
      ${args.body ? `<p style="color:#475569;margin:0">${escapeHtml(args.body)}</p>` : ""}
      ${cta}
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px">warm sitter · 이 메일은 알림 설정에 따라 발송되었습니다.</p>
  </div>`;
}
