// Pure helpers for the billing history / receipt export. Kept free of Prisma
// imports so they are trivially unit-testable.

export interface ReceiptRow {
  createdAt: string | Date;
  orderId: string;
  purpose: string;
  status: string;
  amount: number;
  careFee?: number | null;
  platformFee?: number | null;
  sitterPayout?: number | null;
  method?: string | null;
}

const HEADERS = [
  "date",
  "orderId",
  "purpose",
  "status",
  "amount",
  "careFee",
  "platformFee",
  "sitterPayout",
  "method",
] as const;

// Escape a CSV field per RFC 4180 (quote if it contains comma/quote/newline).
export function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function isoDate(d: string | Date): string {
  return (typeof d === "string" ? new Date(d) : d).toISOString();
}

// Serialize payments to a CSV string with a header row.
export function paymentsToCsv(rows: ReceiptRow[]): string {
  const lines = [HEADERS.join(",")];
  for (const r of rows) {
    lines.push(
      [
        isoDate(r.createdAt),
        r.orderId,
        r.purpose,
        r.status,
        r.amount,
        r.careFee ?? "",
        r.platformFee ?? "",
        r.sitterPayout ?? "",
        r.method ?? "",
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  return lines.join("\r\n");
}

export interface SettlementRow {
  createdAt: string | Date;
  jobTitle?: string | null;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: string;
}

const SETTLEMENT_HEADERS = ["date", "job", "gross", "platformFee", "net", "status"] as const;

// Serialize a sitter's settlements (earnings) to CSV.
export function settlementsToCsv(rows: SettlementRow[]): string {
  const lines = [SETTLEMENT_HEADERS.join(",")];
  for (const r of rows) {
    const d = typeof r.createdAt === "string" ? new Date(r.createdAt) : r.createdAt;
    lines.push(
      [d.toISOString(), r.jobTitle ?? "", r.grossAmount, r.platformFee, r.netAmount, r.status]
        .map(csvEscape)
        .join(",")
    );
  }
  return lines.join("\r\n");
}

// Human-readable label for a payment purpose (UI).
export const PURPOSE_LABEL: Record<string, string> = {
  CARE_FEE: "돌봄비",
  CREDIT_PACK: "크레딧 구매",
  TICKET: "이용권 구매",
  SUBSCRIPTION: "프리미엄 구독",
};
