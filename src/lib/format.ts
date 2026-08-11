// KRW currency formatter used across the UI.
export function won(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}
