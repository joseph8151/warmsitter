"use client";

import { useBilling } from "./BillingProvider";

// Opens the purchase modal on the given tab. Used by the pricing page cards.
export function PricingCta({
  tab,
  label,
  className = "ws-btn-primary",
}: {
  tab: "ticket" | "credit" | "premium";
  label: string;
  className?: string;
}) {
  const { openPurchase } = useBilling();
  return (
    <button onClick={() => openPurchase(tab)} className={className}>
      {label}
    </button>
  );
}
